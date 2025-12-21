import * as vscode from 'vscode';

import type { PtreeConfig } from './core/config';
import { parsePtreeDocument, parseNumeralPrefix, isValidRomanNumeral, parseIndexFile, parseInlineMetadata, type InlineMetadata, type PtreeDirective, type PtreeDocument, type PtreeNode, type PtreeRoot, type SummaryLine } from './core/parser';

/**
 * Semantic Tokens (dynamic highlighting)
 *
 * This is the "next step" beyond a static TextMate grammar.
 *
 * - TextMate grammars cannot read user config, so they can't truly colorize based on
 *   a user-defined [NAME_TYPES] registry.
 * - Semantic tokens CAN: we classify names using the effective config (default/spec/user)
 *   and emit semantic token modifiers like `nt_high_type`, `nt_smol_type`, etc.
 *
 * The TextMate grammar remains as a baseline/fallback.
 */

export const PTREE_SEMANTIC_TOKEN_TYPES = [
  'ptreeScaffold',
  'ptreeDirective',
  'ptreeDirectiveValue',
  'ptreeRoot',
  'ptreeDir',
  'ptreeFile',
  'ptreeExtension',
  'ptreeMeta',
  'ptreeSemver',
  'ptreeNameType',
  'ptreeNumeral',
  'ptreeIndex',
  'ptreeSymlink',
  'ptreeSymlinkArrow',
  'ptreeSymlinkTarget',
  'ptreeAttribute',
  'ptreeAttributeKey',
  'ptreeAttributeValue',
  'ptreeInlineComment'
] as const;

export const PTREE_BASE_TOKEN_MODIFIERS = [
  'mismatch',
  'unknown',
  'nt_custom'
] as const;

const SEMVER_RE = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/g;
const SEMVER_STRICT_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;
const SPLIT_VERSION_RE = new RegExp(`^(.*?)([-_])(${SEMVER_RE.source.replace(/\/$/, '')})$`);

export type PtreeProfile = 'default' | 'spec';

export type SemanticContext = {
  config: PtreeConfig;
  profile: PtreeProfile;
};

export type GetSemanticContext = (document: vscode.TextDocument, parsed: PtreeDocument) => SemanticContext;

function sanitizeNameTypeId(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, '_').toLowerCase();
}

export function nameTypeToModifier(id: string): string {
  return `nt_${sanitizeNameTypeId(id)}`;
}

function safeModifier(mod: string, known: Set<string>): string {
  return known.has(mod) ? mod : 'nt_custom';
}

function compileNameTypeRegexes(config: PtreeConfig): Map<string, RegExp> {
  const out = new Map<string, RegExp>();
  for (const [id, def] of Object.entries(config.NAME_TYPES ?? {})) {
    try {
      out.set(id, new RegExp(def.pattern));
    } catch {
      // Ignore invalid user patterns; validator will surface it.
    }
  }
  return out;
}

function parseNameTypeDirective(raw: string | undefined): Record<string, string> | null {
  if (!raw) return null;
  const out: Record<string, string> = {};
  const re = /\b(ROOT|DIR|FILE|EXT|META|NUMERAL)\b\s*:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out[m[1]] = m[2];
  }
  return Object.keys(out).length > 0 ? out : null;
}

type FileSplitStrategy = 'lastDot' | 'firstDot';

function splitFileParts(fileName: string, strategy: FileSplitStrategy): { stem: string; ext: string | null; dotIndex: number | null } {
  // Dotfile like `.gitignore` counts as extensionless if it's only the leading dot.
  if (fileName.startsWith('.') && fileName.indexOf('.', 1) === -1) {
    return { stem: fileName, ext: null, dotIndex: null };
  }

  const dot = strategy === 'firstDot' ? fileName.indexOf('.') : fileName.lastIndexOf('.');
  if (dot <= 0) return { stem: fileName, ext: null, dotIndex: null };

  return {
    stem: fileName.slice(0, dot),
    ext: fileName.slice(dot + 1),
    dotIndex: dot
  };
}

function stripTrailingMarkers(name: string): { bare: string; marker: '' | '/' | '//' } {
  if (name.endsWith('//')) return { bare: name.slice(0, -2), marker: '//' };
  if (name.endsWith('/')) return { bare: name.slice(0, -1), marker: '/' };
  return { bare: name, marker: '' };
}

function classifyNode(name: string): 'META' | 'DIR' | 'FILE' {
  if (name.endsWith('//')) return 'META';
  if (name.endsWith('/')) return 'DIR';
  return 'FILE';
}

function findMatchingNameTypeId(bareName: string, allowed: string[] | undefined, compiled: Map<string, RegExp>): string | null {
  if (!allowed || allowed.length === 0) return null;
  for (const id of allowed) {
    const re = compiled.get(id);
    if (!re) continue;
    if (re.test(bareName)) return id;
  }
  return null;
}

function findAnyNameTypeId(bareName: string, compiled: Map<string, RegExp>): string | null {
  for (const [id, re] of compiled.entries()) {
    if (re.test(bareName)) return id;
  }
  return null;
}

function isSemverStrict(v: string): boolean {
  return SEMVER_STRICT_RE.test(v.trim());
}

function splitVersion(name: string): { base: string; versionDelimiter: string | null; version: string | null } {
  const m = name.match(SPLIT_VERSION_RE);
  if (!m) return { base: name, versionDelimiter: null, version: null };
  return { base: m[1], versionDelimiter: m[2], version: m[3] };
}

type Tok = { start: number; len: number; type: (typeof PTREE_SEMANTIC_TOKEN_TYPES)[number]; mods?: string[] };

function pushSortedNonOverlapping(builder: vscode.SemanticTokensBuilder, line: number, toks: Tok[]) {
  const sorted = toks
    .filter(t => t.len > 0)
    .sort((a, b) => (a.start - b.start) || (b.len - a.len));

  let lastEnd = -1;
  for (const t of sorted) {
    if (t.start < lastEnd) continue;
    const range = new vscode.Range(line, t.start, line, t.start + t.len);
    builder.push(range, t.type, t.mods ?? []);
    lastEnd = t.start + t.len;
  }
}

export function buildSemanticLegend(nameTypeIds: string[]): {
  legend: vscode.SemanticTokensLegend;
  knownModifiers: Set<string>;
  legendKey: string;
} {
  const mods = new Set<string>();
  for (const m of PTREE_BASE_TOKEN_MODIFIERS) mods.add(m);

  for (const id of nameTypeIds) {
    mods.add(nameTypeToModifier(id));
  }

  // Stable order for key + legend.
  const modList = Array.from(mods).sort();
  const legendKey = JSON.stringify({ t: Array.from(PTREE_SEMANTIC_TOKEN_TYPES), m: modList });

  return {
    legend: new vscode.SemanticTokensLegend(Array.from(PTREE_SEMANTIC_TOKEN_TYPES), modList),
    knownModifiers: new Set(modList),
    legendKey
  };
}

export class PtreeSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  private readonly _onDidChangeSemanticTokens = new vscode.EventEmitter<void>();
  public readonly onDidChangeSemanticTokens = this._onDidChangeSemanticTokens.event;

  constructor(
    private readonly legend: vscode.SemanticTokensLegend,
    private readonly knownModifiers: Set<string>,
    private readonly getContext: GetSemanticContext
  ) {}

  public refresh() {
    this._onDidChangeSemanticTokens.fire();
  }

  provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    if (token.isCancellationRequested) return null;

    const text = document.getText();
    const doc: PtreeDocument = parsePtreeDocument(text);

    const { config } = this.getContext(document, doc);
    const compiled = compileNameTypeRegexes(config);

    const fileSplit: FileSplitStrategy = config.FILE_EXTENSION_SPLIT === 'firstDot' ? 'firstDot' : 'lastDot';

    const nameTypeOverride = parseNameTypeDirective(doc.directives['name_type']);
    const allowedFor = (entity: 'ROOT' | 'DIR' | 'FILE' | 'META' | 'EXT' | 'NUMERAL'): string[] | undefined => {
      const forced = nameTypeOverride?.[entity];
      if (forced) return [forced];
      return config.ENTITY_NAME_TYPES?.[entity];
    };

    const builder = new vscode.SemanticTokensBuilder(this.legend);
    const coveredDirectiveLines = new Set<number>();

    // 1) Directives (including multi-line blocks)
    for (const d of doc.directiveLines) {
      const rawLines = d.raw.split(/\r?\n/);
      for (let offset = 0; offset < rawLines.length; offset++) {
        const lineNo = d.line + offset;
        if (lineNo < 0 || lineNo >= document.lineCount) continue;
        coveredDirectiveLines.add(lineNo);

        const lineText = document.lineAt(lineNo).text;
        const toks: Tok[] = [];

        // Highlight '@key'
        const keyMatch = lineText.match(/@([A-Za-z][A-Za-z0-9_-]*)/);
        if (keyMatch && keyMatch.index !== undefined) {
          const start = keyMatch.index;
          const len = keyMatch[0].length;
          toks.push({ start, len, type: 'ptreeDirective' });
        }

        // Highlight entity keys inside blocks (ROOT:, DIR:, FILE: ...)
        const entRe = /\b(ROOT|DIR|FILE|EXT|META)\b(?=\s*:)/g;
        let em: RegExpExecArray | null;
        while ((em = entRe.exec(lineText)) !== null) {
          toks.push({ start: em.index, len: em[0].length, type: 'ptreeMeta' });
        }

        // Highlight quoted strings (name types, delimiters, etc)
        const qRe = /(['"])([^'"]+)\1/g;
        let qm: RegExpExecArray | null;
        while ((qm = qRe.exec(lineText)) !== null) {
          const full = qm[0];
          const inner = qm[2];
          const start = qm.index + 1; // inside the quotes
          const len = inner.length;

          if (Object.prototype.hasOwnProperty.call(config.NAME_TYPES ?? {}, inner)) {
            const mod = safeModifier(nameTypeToModifier(inner), this.knownModifiers);
            toks.push({ start, len, type: 'ptreeNameType', mods: [mod] });
          } else if (d.key === 'name_type') {
            // In @name_type blocks, unknown names are meaningful.
            toks.push({ start, len, type: 'ptreeNameType', mods: ['unknown'] });
          } else {
            // Generic directive value string.
            toks.push({ start, len, type: 'ptreeDirectiveValue' });
          }

          // Also highlight the quotes themselves as meta, but only if it won't overlap.
          // (Keep this subtle; themes usually dim meta.)
          toks.push({ start: qm.index, len: 1, type: 'ptreeMeta' });
          toks.push({ start: qm.index + full.length - 1, len: 1, type: 'ptreeMeta' });
        }

        // Highlight semver occurrences inside directives (mainly @version)
        let sm: RegExpExecArray | null;
        const svRe = new RegExp(SEMVER_RE.source, 'g');
        while ((sm = svRe.exec(lineText)) !== null) {
          toks.push({ start: sm.index, len: sm[0].length, type: 'ptreeSemver' });
        }

        pushSortedNonOverlapping(builder, lineNo, toks);
      }
    }

    // 2) Root line
    if (doc.root) {
      const r = doc.root;
      const lineText = document.lineAt(r.line).text;
      const toks: Tok[] = [];
      this.tokenizeRootLine(r, lineText, allowedFor('ROOT'), compiled, toks);
      pushSortedNonOverlapping(builder, r.line, toks);
    }

    // 3) Nodes
    for (const n of doc.nodes) {
      if (token.isCancellationRequested) break;
      // Don't re-tokenize directive-covered lines.
      if (coveredDirectiveLines.has(n.line)) continue;

      const lineText = document.lineAt(n.line).text;
      const toks: Tok[] = [];
      this.tokenizeNodeLine(n, lineText, allowedFor, compiled, fileSplit, toks);
      pushSortedNonOverlapping(builder, n.line, toks);
    }

    // 4) Summary line (e.g., "8 directories, 20 files")
    if (doc.summaryLine) {
      const s = doc.summaryLine;
      if (s.line >= 0 && s.line < document.lineCount) {
        const lineText = document.lineAt(s.line).text;
        const toks: Tok[] = [];
        // Emit the entire summary line as ptreeMeta token
        toks.push({ start: s.startCol, len: s.endCol - s.startCol, type: 'ptreeMeta' });
        pushSortedNonOverlapping(builder, s.line, toks);
      }
    }

    return builder.build();
  }

  private tokenizeRootLine(
    root: PtreeRoot,
    lineText: string,
    allowedRootTypes: string[] | undefined,
    compiled: Map<string, RegExp>,
    out: Tok[]
  ) {
    // Highlight as either a root path or a root label.
    const rawValue = root.value.trimEnd();
    const start = root.startCol;

    if (root.kind === 'rootPath') {
      out.push({ start, len: rawValue.trim().length, type: 'ptreeRoot' });
      return;
    }

    // root label (ends with //)
    const label = rawValue.endsWith('//') ? rawValue.slice(0, -2) : rawValue;
    const markerStart = start + label.length;

    const { base, versionDelimiter, version } = splitVersion(label);

    // Base token
    const expectedMatch = findMatchingNameTypeId(base, allowedRootTypes, compiled);
    const anyMatch = expectedMatch ?? findAnyNameTypeId(base, compiled);
    const ok = expectedMatch !== null;
    const mods: string[] = [];

    if (anyMatch) mods.push(safeModifier(nameTypeToModifier(anyMatch), this.knownModifiers));
    else mods.push('nt_custom');
    if (!ok) mods.push('mismatch');

    out.push({ start, len: base.length, type: 'ptreeRoot', mods });

    // Version delimiter + version
    if (versionDelimiter && version) {
      const delimPos = start + base.length;
      out.push({ start: delimPos, len: 1, type: 'ptreeMeta' });
      out.push({ start: delimPos + 1, len: version.length, type: 'ptreeSemver' });
    }

    // Trailing // marker
    if (rawValue.endsWith('//')) {
      out.push({ start: markerStart, len: 2, type: 'ptreeMeta' });
    }
  }

  private tokenizeNodeLine(
    node: PtreeNode,
    lineText: string,
    allowedFor: (entity: 'ROOT' | 'DIR' | 'FILE' | 'META' | 'EXT' | 'NUMERAL') => string[] | undefined,
    compiled: Map<string, RegExp>,
    fileSplit: FileSplitStrategy,
    out: Tok[]
  ) {
    // Scaffold (tree characters + connector) = 0..startCol
    if (node.startCol > 0) {
      out.push({ start: 0, len: node.startCol, type: 'ptreeScaffold' });
    }

    const kind = classifyNode(node.name);
    const { bare, marker } = stripTrailingMarkers(node.name);
    const nameStart = node.startCol;

    // Handle symlink trailing part with distinct tokens
    // The trailing field contains: " -> target" and optionally metadata after
    if (node.symlinkTarget !== undefined && node.trailing.length > 0) {
      // Find the arrow in the trailing part
      const arrowToken = ' -> ';
      const arrowIdx = node.trailing.indexOf(arrowToken);
      if (arrowIdx !== -1) {
        const trailingStart = node.endCol;
        
        // Emit arrow token (including leading space)
        const arrowStart = trailingStart + arrowIdx;
        out.push({ start: arrowStart, len: arrowToken.length, type: 'ptreeSymlinkArrow' });
        
        // Emit target token
        const targetStart = arrowStart + arrowToken.length;
        const targetLen = node.symlinkTarget.length;
        out.push({ start: targetStart, len: targetLen, type: 'ptreeSymlinkTarget' });
        
        // Handle any metadata after the target (e.g., "  [attr=value]" or "  # comment")
        const afterTarget = node.trailing.slice(arrowIdx + arrowToken.length + targetLen);
        if (afterTarget.trim().length > 0) {
          const metaStart = targetStart + targetLen;
          // Try to parse and tokenize inline metadata
          this.tokenizeInlineMetadata(afterTarget, metaStart, out);
        }
      }
    } else if (node.endCol < lineText.length) {
      // Non-symlink: inline metadata/comments (after endCol)
      const metaPart = lineText.slice(node.endCol);
      if (metaPart.trim().length > 0) {
        // Try to parse and tokenize inline metadata
        this.tokenizeInlineMetadata(metaPart, node.endCol, out);
      }
    }

    if (kind === 'DIR') {
      // Check for Roman numeral prefix (e.g., "I_Introduction", "II_Content")
      const { numeral, remainder } = parseNumeralPrefix(bare);
      
      if (numeral && isValidRomanNumeral(numeral)) {
        // Emit ptreeNumeral token for the Roman numeral prefix
        out.push({ start: nameStart, len: numeral.length, type: 'ptreeNumeral' });
        
        // Emit underscore separator as meta
        const underscorePos = nameStart + numeral.length;
        out.push({ start: underscorePos, len: 1, type: 'ptreeMeta' });
        
        // Emit the remainder with DIR NAME_TYPE validation
        const remainderStart = underscorePos + 1;
        const allowed = allowedFor('DIR');
        const expected = findMatchingNameTypeId(remainder, allowed, compiled);
        const any = expected ?? findAnyNameTypeId(remainder, compiled);
        const ok = expected !== null;

        const mods: string[] = [];
        if (any) mods.push(safeModifier(nameTypeToModifier(any), this.knownModifiers));
        else mods.push('nt_custom');
        if (!ok) mods.push('mismatch');

        out.push({ start: remainderStart, len: remainder.length, type: 'ptreeDir', mods });
      } else {
        // No numeral prefix - standard DIR handling
        const allowed = allowedFor('DIR');
        const expected = findMatchingNameTypeId(bare, allowed, compiled);
        const any = expected ?? findAnyNameTypeId(bare, compiled);
        const ok = expected !== null;

        const mods: string[] = [];
        if (any) mods.push(safeModifier(nameTypeToModifier(any), this.knownModifiers));
        else mods.push('nt_custom');
        if (!ok) mods.push('mismatch');

        out.push({ start: nameStart, len: bare.length, type: 'ptreeDir', mods });
      }
      
      if (marker) out.push({ start: nameStart + bare.length, len: marker.length, type: 'ptreeMeta' });
      return;
    }

    if (kind === 'META') {
      const allowed = allowedFor('META');
      const expected = findMatchingNameTypeId(bare, allowed, compiled);
      const any = expected ?? findAnyNameTypeId(bare, compiled);
      const ok = expected !== null;

      const mods: string[] = [];
      if (any) mods.push(safeModifier(nameTypeToModifier(any), this.knownModifiers));
      else mods.push('nt_custom');
      if (!ok) mods.push('mismatch');

      out.push({ start: nameStart, len: bare.length, type: 'ptreeMeta', mods });
      if (marker) out.push({ start: nameStart + bare.length, len: marker.length, type: 'ptreeMeta' });
      return;
    }

    // FILE
    // Check for index file prefix (e.g., "(index)", "(index)-introduction")
    const { isIndex, remainder: indexRemainder } = parseIndexFile(bare);
    
    if (isIndex) {
      // Emit ptreeIndex token for the "(index)" prefix
      const indexPrefixLen = '(index)'.length;
      out.push({ start: nameStart, len: indexPrefixLen, type: 'ptreeIndex' });
      
      // If there's a separator and remainder, emit them
      if (indexRemainder.length > 0) {
        // There's a separator (- or _) after (index)
        const separatorPos = nameStart + indexPrefixLen;
        const separatorChar = bare.charAt(indexPrefixLen);
        if (separatorChar === '-' || separatorChar === '_') {
          out.push({ start: separatorPos, len: 1, type: 'ptreeMeta' });
          
          // Emit the remainder with FILE NAME_TYPE validation
          const remainderStart = separatorPos + 1;
          const remainderForValidation = indexRemainder;
          const remainderParts = splitFileParts(remainderForValidation, fileSplit);
          
          const allowed = allowedFor('FILE');
          const expected = findMatchingNameTypeId(remainderParts.stem, allowed, compiled);
          const any = expected ?? findAnyNameTypeId(remainderParts.stem, compiled);
          const ok = expected !== null;

          const mods: string[] = [];
          if (any) mods.push(safeModifier(nameTypeToModifier(any), this.knownModifiers));
          else mods.push('nt_custom');
          if (!ok) mods.push('mismatch');

          out.push({ start: remainderStart, len: remainderParts.stem.length, type: 'ptreeFile', mods });
          
          // Extension for the remainder
          if (remainderParts.ext && remainderParts.dotIndex !== null) {
            const extStart = remainderStart + remainderParts.dotIndex + 1;
            
            const allowedExt = allowedFor('EXT');
            const extExpected = findMatchingNameTypeId(remainderParts.ext, allowedExt, compiled);
            const extAny = extExpected ?? findAnyNameTypeId(remainderParts.ext, compiled);
            
            const extMods: string[] = [];
            if (extAny) extMods.push(safeModifier(nameTypeToModifier(extAny), this.knownModifiers));
            else extMods.push('nt_custom');
            if (extExpected === null && allowedExt && allowedExt.length > 0) extMods.push('mismatch');
            
            out.push({ start: extStart, len: remainderParts.ext.length, type: 'ptreeExtension', mods: extMods });
          }
        } else {
          // No separator, just the remainder directly after (index)
          const remainderStart = nameStart + indexPrefixLen;
          const remainderParts = splitFileParts(indexRemainder, fileSplit);
          
          const allowed = allowedFor('FILE');
          const expected = findMatchingNameTypeId(remainderParts.stem, allowed, compiled);
          const any = expected ?? findAnyNameTypeId(remainderParts.stem, compiled);
          const ok = expected !== null;

          const mods: string[] = [];
          if (any) mods.push(safeModifier(nameTypeToModifier(any), this.knownModifiers));
          else mods.push('nt_custom');
          if (!ok) mods.push('mismatch');

          if (remainderParts.stem.length > 0) {
            out.push({ start: remainderStart, len: remainderParts.stem.length, type: 'ptreeFile', mods });
          }
          
          // Extension for the remainder
          if (remainderParts.ext && remainderParts.dotIndex !== null) {
            const extStart = remainderStart + remainderParts.dotIndex + 1;
            
            const allowedExt = allowedFor('EXT');
            const extExpected = findMatchingNameTypeId(remainderParts.ext, allowedExt, compiled);
            const extAny = extExpected ?? findAnyNameTypeId(remainderParts.ext, compiled);
            
            const extMods: string[] = [];
            if (extAny) extMods.push(safeModifier(nameTypeToModifier(extAny), this.knownModifiers));
            else extMods.push('nt_custom');
            if (extExpected === null && allowedExt && allowedExt.length > 0) extMods.push('mismatch');
            
            out.push({ start: extStart, len: remainderParts.ext.length, type: 'ptreeExtension', mods: extMods });
          }
        }
      }
      // If no remainder, just the (index) prefix is the whole file name
    } else {
      // Standard FILE handling (no index prefix)
      // Determine if this is a symlink - use ptreeSymlink token type for symlinks
      const isSymlink = node.symlinkTarget !== undefined;
      const fileTokenType = isSymlink ? 'ptreeSymlink' : 'ptreeFile';
      
      const allowed = allowedFor('FILE');
      const parts = splitFileParts(bare, fileSplit);
      const expected = findMatchingNameTypeId(parts.stem, allowed, compiled);
      const any = expected ?? findAnyNameTypeId(parts.stem, compiled);
      const ok = expected !== null;

      const mods: string[] = [];
      if (any) mods.push(safeModifier(nameTypeToModifier(any), this.knownModifiers));
      else mods.push('nt_custom');
      if (!ok) mods.push('mismatch');

      // Stem
      out.push({ start: nameStart, len: parts.stem.length, type: fileTokenType, mods });

      // Extension (everything after the chosen dot) with NAME_TYPE modifier
      if (parts.ext && parts.dotIndex !== null) {
        const extStart = nameStart + parts.dotIndex + 1;
        
        // Get allowed EXT NAME_TYPEs from config
        const allowedExt = allowedFor('EXT');
        const extExpected = findMatchingNameTypeId(parts.ext, allowedExt, compiled);
        const extAny = extExpected ?? findAnyNameTypeId(parts.ext, compiled);
        
        const extMods: string[] = [];
        if (extAny) extMods.push(safeModifier(nameTypeToModifier(extAny), this.knownModifiers));
        else extMods.push('nt_custom');
        if (extExpected === null && allowedExt && allowedExt.length > 0) extMods.push('mismatch');
        
        out.push({ start: extStart, len: parts.ext.length, type: 'ptreeExtension', mods: extMods });
      }
    }

    if (marker) {
      // Not expected for files, but safe.
      out.push({ start: nameStart + bare.length, len: marker.length, type: 'ptreeMeta' });
    }
  }

  /**
   * Tokenize inline metadata (bracket attributes and/or inline comments).
   * Emits distinct tokens for:
   * - Bracket delimiters [ ]
   * - Attribute keys
   * - Attribute values
   * - Inline comment # and text
   * 
   * @param metaPart The metadata portion of the line (including leading spaces)
   * @param startCol The column where metaPart starts in the line
   * @param out The token array to push to
   */
  private tokenizeInlineMetadata(metaPart: string, startCol: number, out: Tok[]) {
    // Check for leading spaces (metadata requires 2+ spaces)
    const leadingSpaceMatch = metaPart.match(/^(\s{2,})/);
    if (!leadingSpaceMatch) {
      // No proper metadata prefix, emit as generic meta
      out.push({ start: startCol, len: metaPart.length, type: 'ptreeMeta' });
      return;
    }

    let currentPos = startCol + leadingSpaceMatch[1].length;
    let remaining = metaPart.slice(leadingSpaceMatch[1].length);

    // Try to parse bracket attributes: [key=value, key2=value2]
    const bracketMatch = remaining.match(/^\[([^\]]*)\]/);
    if (bracketMatch) {
      const bracketStart = currentPos;
      const bracketContent = bracketMatch[1];
      
      // Opening bracket
      out.push({ start: bracketStart, len: 1, type: 'ptreeAttribute' });
      
      // Parse and tokenize key=value pairs
      let contentPos = bracketStart + 1;
      const pairs = bracketContent.split(',');
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const trimmedPair = pair.trim();
        
        // Find the actual position of this pair in the content
        const pairStartInContent = bracketContent.indexOf(pair, contentPos - bracketStart - 1);
        const pairStart = bracketStart + 1 + pairStartInContent;
        
        // Skip leading whitespace in the pair
        const leadingWs = pair.match(/^\s*/)?.[0].length ?? 0;
        const keyStart = pairStart + leadingWs;
        
        const eqIdx = trimmedPair.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmedPair.slice(0, eqIdx);
          const value = trimmedPair.slice(eqIdx + 1);
          
          // Key token
          out.push({ start: keyStart, len: key.length, type: 'ptreeAttributeKey' });
          
          // Equals sign (as meta)
          out.push({ start: keyStart + key.length, len: 1, type: 'ptreeMeta' });
          
          // Value token
          if (value.length > 0) {
            out.push({ start: keyStart + key.length + 1, len: value.length, type: 'ptreeAttributeValue' });
          }
        } else if (trimmedPair.length > 0) {
          // Boolean flag (key without value)
          out.push({ start: keyStart, len: trimmedPair.length, type: 'ptreeAttributeKey' });
        }
        
        // Comma separator (if not last)
        if (i < pairs.length - 1) {
          const commaPos = pairStart + pair.length;
          out.push({ start: commaPos, len: 1, type: 'ptreeMeta' });
        }
        
        contentPos = pairStart + pair.length + 1; // +1 for comma
      }
      
      // Closing bracket
      out.push({ start: bracketStart + bracketContent.length + 1, len: 1, type: 'ptreeAttribute' });
      
      currentPos = bracketStart + bracketMatch[0].length;
      remaining = remaining.slice(bracketMatch[0].length);
    }

    // Try to parse inline comment: # comment text (may follow bracket attributes)
    const commentMatch = remaining.match(/^\s{2,}#\s*(.*)/);
    if (commentMatch) {
      const commentFullMatch = remaining.match(/^(\s{2,})(#)(\s*)(.*)/);
      if (commentFullMatch) {
        const spacesLen = commentFullMatch[1].length;
        const hashStart = currentPos + spacesLen;
        
        // Hash symbol
        out.push({ start: hashStart, len: 1, type: 'ptreeInlineComment' });
        
        // Comment text (if any)
        const commentText = commentFullMatch[4];
        if (commentText.length > 0) {
          const textStart = hashStart + 1 + commentFullMatch[3].length;
          out.push({ start: textStart, len: commentText.length, type: 'ptreeInlineComment' });
        }
      }
    } else if (remaining.match(/^#\s*(.*)/)) {
      // Comment without 2+ space prefix (directly after bracket attributes)
      const directCommentMatch = remaining.match(/^(#)(\s*)(.*)/);
      if (directCommentMatch) {
        const hashStart = currentPos;
        
        // Hash symbol
        out.push({ start: hashStart, len: 1, type: 'ptreeInlineComment' });
        
        // Comment text (if any)
        const commentText = directCommentMatch[3];
        if (commentText.length > 0) {
          const textStart = hashStart + 1 + directCommentMatch[2].length;
          out.push({ start: textStart, len: commentText.length, type: 'ptreeInlineComment' });
        }
      }
    }
  }
}

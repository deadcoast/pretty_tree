import * as vscode from 'vscode';

import type { PtreeConfig } from './core/config';
import { parsePtreeDocument, type PtreeDirective, type PtreeDocument, type PtreeNode, type PtreeRoot } from './core/parser';

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
  'ptreeNameType'
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
  const re = /\b(ROOT|DIR|FILE|EXT|META)\b\s*:\s*['"]([^'"]+)['"]/g;
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
    const allowedFor = (entity: 'ROOT' | 'DIR' | 'FILE' | 'META'): string[] | undefined => {
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
    allowedFor: (entity: 'ROOT' | 'DIR' | 'FILE' | 'META') => string[] | undefined,
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

    // Inline metadata/comments (after endCol)
    if (node.endCol < lineText.length) {
      const metaPart = lineText.slice(node.endCol);
      if (metaPart.trim().length > 0) {
        out.push({ start: node.endCol, len: lineText.length - node.endCol, type: 'ptreeMeta' });
      }
    }

    if (kind === 'DIR') {
      const allowed = allowedFor('DIR');
      const expected = findMatchingNameTypeId(bare, allowed, compiled);
      const any = expected ?? findAnyNameTypeId(bare, compiled);
      const ok = expected !== null;

      const mods: string[] = [];
      if (any) mods.push(safeModifier(nameTypeToModifier(any), this.knownModifiers));
      else mods.push('nt_custom');
      if (!ok) mods.push('mismatch');

      out.push({ start: nameStart, len: bare.length, type: 'ptreeDir', mods });
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
    out.push({ start: nameStart, len: parts.stem.length, type: 'ptreeFile', mods });

    // Extension (everything after the chosen dot)
    if (parts.ext && parts.dotIndex !== null) {
      const extStart = nameStart + parts.dotIndex + 1;
      out.push({ start: extStart, len: parts.ext.length, type: 'ptreeExtension' });
    }

    if (marker) {
      // Not expected for files, but safe.
      out.push({ start: nameStart + bare.length, len: marker.length, type: 'ptreeMeta' });
    }
  }
}

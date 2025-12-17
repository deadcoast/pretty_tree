import * as vscode from 'vscode';

import { parsePtreeDocument } from './core/parser';
import { loadEffectiveConfig } from './core/config';
import { validatePtreeDocument } from './core/validator';
import { applyCanonicalFixes } from './core/fixer';

/**
 * ptree is a text format for directory-tree representations.
 *
 * This extension provides:
 * - TextMate highlighting (syntaxes/ptree.tmLanguage.json)
 * - A smart FoldingRangeProvider that understands tree depth
 * - Optional linting/validation (ruleset + NAME_TYPES registry)
 * - Convenience commands to copy the path at the cursor
 */

type LineKind = 'root' | 'node' | 'directive' | 'comment' | 'blank' | 'other';

interface ParsedLine {
  kind: LineKind;
  depth: number; // root = -1, top-level node = 0
  /** Visible label/name (without inline metadata/comment, without symlink target) */
  name?: string;
  /** Raw remainder (after connector) */
  raw?: string;
  /** Directive key/value (if directive) */
  directiveKey?: string;
  directiveValue?: string;
}

// Supports the common unicode tree style and a simple ASCII alternative.
// Prefix is made of repeating 4-char segments: "│   " or "    " (unicode) OR "|   " or "    " (ascii)
// Connector is: "├──" | "└──" (unicode) OR "|--" | "`--" (ascii)
const NODE_RE = /^((?:(?:│|\|) {3}| {4})*)(?:├──|└──|\|--|`--)(?:\s+)(.*)$/u;

// Directive lines: start with '@' (used by the ptree spec, but optional)
const DIRECTIVE_RE = /^\s*@([A-Za-z][A-Za-z0-9_-]*)(?:\s*[:=]\s*(.*))?$/u;

// Root line: first non-blank, non-directive, non-comment line that doesn't look like a node.
// We intentionally keep this permissive.
const ROOT_LIKE_RE = /^\s*[^#\s].*$/u;

function countDepth(prefix: string): number {
  // Count in 4-character chunks, but be tolerant of oddities.
  let depth = 0;
  for (let i = 0; i + 3 < prefix.length; i += 4) {
    const seg = prefix.slice(i, i + 4);
    if (seg === '│   ' || seg === '|   ' || seg === '    ') {
      depth += 1;
    } else {
      // If someone used weird spacing, fall back to an approximation.
      break;
    }
  }
  return depth;
}

function stripInlineMeta(namePart: string): string {
  let s = namePart;

  // If this looks like a symlink, keep only the LHS name.
  const arrowIdx = s.indexOf(' -> ');
  if (arrowIdx !== -1) s = s.slice(0, arrowIdx);

  // Remove inline metadata/comments starting with 2+ spaces then # or [
  const metaMatch = s.match(/\s{2,}(#|\[)/u);
  if (metaMatch?.index !== undefined) {
    s = s.slice(0, metaMatch.index);
  }

  return s.trim();
}

function parseLine(text: string, isFirstRootCandidate: boolean): ParsedLine {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { kind: 'blank', depth: 0 };
  if (trimmed.startsWith('#')) return { kind: 'comment', depth: 0 };

  const dm = text.match(DIRECTIVE_RE);
  if (dm) {
    const key = dm[1];
    const value = (dm[2] ?? '').trim();
    return { kind: 'directive', depth: 0, directiveKey: key, directiveValue: value };
  }

  const m = text.match(NODE_RE);
  if (m) {
    const prefix = m[1] ?? '';
    const remainder = m[2] ?? '';
    const depth = countDepth(prefix);
    const name = stripInlineMeta(remainder);
    return { kind: 'node', depth, name, raw: remainder };
  }

  if (isFirstRootCandidate && ROOT_LIKE_RE.test(text)) {
    const name = stripInlineMeta(text);
    return { kind: 'root', depth: -1, name, raw: text };
  }

  return { kind: 'other', depth: 0 };
}

class PtreeFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    _context: vscode.FoldingContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.FoldingRange[]> {
    const ranges: vscode.FoldingRange[] = [];

    // Track whether we've already treated a line as the root.
    let rootSeen = false;

    // Stack of open nodes.
    const stack: Array<{ line: number; depth: number; hasChild: boolean }> = [];

    const closeUntilDepth = (depth: number, endLineExclusive: number) => {
      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        const node = stack.pop()!;
        const endLine = endLineExclusive - 1;
        if (node.hasChild && node.line < endLine) {
          ranges.push(new vscode.FoldingRange(node.line, endLine, vscode.FoldingRangeKind.Region));
        }
      }
    };

    for (let i = 0; i < document.lineCount; i++) {
      if (token.isCancellationRequested) return [];

      const text = document.lineAt(i).text;
      const parsed = parseLine(text, !rootSeen);

      if (parsed.kind === 'root') {
        rootSeen = true;
        closeUntilDepth(parsed.depth, i);
        if (stack.length > 0) stack[stack.length - 1].hasChild = true;
        stack.push({ line: i, depth: parsed.depth, hasChild: false });
        continue;
      }

      if (parsed.kind !== 'node') continue;

      closeUntilDepth(parsed.depth, i);
      if (stack.length > 0) stack[stack.length - 1].hasChild = true;
      stack.push({ line: i, depth: parsed.depth, hasChild: false });
    }

    const lastLine = document.lineCount - 1;
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.hasChild && node.line < lastLine) {
        ranges.push(new vscode.FoldingRange(node.line, lastLine, vscode.FoldingRangeKind.Region));
      }
    }

    return ranges;
  }
}

function normalizeSlashes(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/');
}

function ensureTrailingSlash(root: string): string {
  const r = root.trim();
  return r.endsWith('/') ? r : `${r}/`;
}

function stripTrailingMarkers(name: string): { base: string; hadDirSlash: boolean } {
  if (name.endsWith('//')) return { base: name.slice(0, -2), hadDirSlash: false };
  if (name.endsWith('/')) return { base: name.slice(0, -1), hadDirSlash: true };
  return { base: name, hadDirSlash: false };
}

function buildPathAtLine(document: vscode.TextDocument, targetLine: number): { full: string; relative: string } | null {
  let rootSeen = false;
  let rootLineValue: string | undefined;
  let rootDirectiveValue: string | undefined;

  // componentsByDepth[depth] = name
  const componentsByDepth: string[] = [];

  for (let i = 0; i <= targetLine && i < document.lineCount; i++) {
    const text = document.lineAt(i).text;
    const parsed = parseLine(text, !rootSeen);

    if (parsed.kind === 'directive' && parsed.directiveKey?.toLowerCase() === 'root') {
      // Prefer @root for path reconstruction.
      rootDirectiveValue = parsed.directiveValue;
      continue;
    }

    if (parsed.kind === 'root') {
      rootSeen = true;
      rootLineValue = parsed.name;
      continue;
    }

    if (parsed.kind !== 'node' || !parsed.name) continue;

    const { base } = stripTrailingMarkers(parsed.name);
    componentsByDepth[parsed.depth] = base;
    componentsByDepth.length = parsed.depth + 1;

    if (i === targetLine) {
      const rawRel = componentsByDepth.join('/');
      const targetHadSlash = parsed.name.endsWith('/');
      const rel = targetHadSlash ? `${rawRel}/` : rawRel;

      // Determine the "real" root prefix.
      const rootPrefix = (() => {
        if (rootDirectiveValue && rootDirectiveValue.trim().length > 0) {
          return ensureTrailingSlash(rootDirectiveValue.trim());
        }
        if (rootLineValue && rootLineValue.trim().length > 0) {
          const v = rootLineValue.trim();
          // If root line is a label ending with //, it is not a filesystem path.
          if (v.endsWith('//')) return '';
          return ensureTrailingSlash(v);
        }
        return '';
      })();

      const full = rootPrefix ? `${rootPrefix}${rel}` : rel;
      return {
        full: normalizeSlashes(full),
        relative: normalizeSlashes(rel)
      };
    }
  }

  return null;
}

function toVscodeSeverity(sev: string): vscode.DiagnosticSeverity {
  switch (sev) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'info':
      return vscode.DiagnosticSeverity.Information;
    case 'warning':
    default:
      return vscode.DiagnosticSeverity.Warning;
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Folding
  const foldingProvider = new PtreeFoldingProvider();
  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider({ language: 'ptree' }, foldingProvider)
  );

  // Diagnostics (lint)
  const diagnostics = vscode.languages.createDiagnosticCollection('ptree');
  context.subscriptions.push(diagnostics);

  const validate = (document: vscode.TextDocument) => {
    if (document.languageId !== 'ptree') return;

    try {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      const workspaceRoot = workspaceFolder?.uri.fsPath;

      const doc = parsePtreeDocument(document.getText());
      const profile = (doc.directives['ptree'] ?? '').trim() === 'spec' ? 'spec' : 'default';
      const { config } = loadEffectiveConfig(context.extensionPath, workspaceRoot, profile);
      const msgs = validatePtreeDocument(doc, config);

      const diags = msgs.map(m => {
        const range = new vscode.Range(
          m.line,
          m.startCol,
          m.line,
          Math.max(m.startCol + 1, m.endCol)
        );
        const d = new vscode.Diagnostic(range, `[${m.code}] ${m.message}`, toVscodeSeverity(m.severity));
        d.code = m.code;
        return d;
      });

      diagnostics.set(document.uri, diags);
    } catch (err: any) {
      // Never crash the extension due to malformed config.
      const d = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 1),
        `ptree: Failed to load config or validate document: ${String(err?.message ?? err)}`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostics.set(document.uri, [d]);
    }
  };

  // Validate currently-open docs.
  for (const doc of vscode.workspace.textDocuments) {
    validate(doc);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(validate),
    vscode.workspace.onDidSaveTextDocument(doc => {
      validate(doc);

      // If a config file was saved, re-validate all open ptree docs.
      const baseName = doc.uri.path.split('/').pop() ?? '';
      if (['.ptreerc.json', '.ptree.json', 'ptree.config.json'].includes(baseName)) {
        for (const openDoc of vscode.workspace.textDocuments) {
          validate(openDoc);
        }
      }
    }),
    vscode.workspace.onDidChangeTextDocument(e => {
      validate(e.document);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ptree.validateDocument', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      validate(editor.document);
      vscode.window.showInformationMessage('ptree: Validation complete.');
    })
  );

  // Command: apply canonical fixes (safe, mechanical fixes only)
  context.subscriptions.push(
    vscode.commands.registerCommand('ptree.fixDocument', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const document = editor.document;
      if (document.languageId !== 'ptree') {
        vscode.window.showInformationMessage('ptree: Active document is not a ptree file.');
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      const workspaceRoot = workspaceFolder?.uri.fsPath;

      const doc = parsePtreeDocument(document.getText());
      const profile = (doc.directives['ptree'] ?? '').trim() === 'spec' ? 'spec' : 'default';
      const { config } = loadEffectiveConfig(context.extensionPath, workspaceRoot, profile);

      const res = applyCanonicalFixes(document.getText(), doc, config);
      if (res.applied.length === 0) {
        vscode.window.showInformationMessage('ptree: No fixes to apply.');
        return;
      }

      const lastLine = document.lineAt(Math.max(0, document.lineCount - 1));
      const fullRange = new vscode.Range(0, 0, Math.max(0, document.lineCount - 1), lastLine.text.length);

      await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, res.fixedText);
      });

      vscode.window.showInformationMessage(`ptree: Applied ${res.applied.length} fix(es).`);
      validate(document);
    })
  );

  // Commands: copy path
  context.subscriptions.push(
    vscode.commands.registerCommand('ptree.copyPathAtCursor', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      const line = editor.selection.active.line;

      const path = buildPathAtLine(doc, line);
      if (!path) {
        vscode.window.showInformationMessage('ptree: No node detected at cursor line.');
        return;
      }

      await vscode.env.clipboard.writeText(path.full);
      vscode.window.showInformationMessage(`ptree: Copied full path: ${path.full}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ptree.copyRelativePathAtCursor', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      const line = editor.selection.active.line;

      const path = buildPathAtLine(doc, line);
      if (!path) {
        vscode.window.showInformationMessage('ptree: No node detected at cursor line.');
        return;
      }

      await vscode.env.clipboard.writeText(path.relative);
      vscode.window.showInformationMessage(`ptree: Copied relative path: ${path.relative}`);
    })
  );
}

export function deactivate() {
  // no-op
}
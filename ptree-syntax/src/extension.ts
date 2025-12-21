import * as vscode from 'vscode';

import { parsePtreeDocument } from './core/parser';
import { loadEffectiveConfig } from './core/config';
import { validatePtreeDocument } from './core/validator';
import { applyCanonicalFixes } from './core/fixer';
import { buildSemanticLegend, PtreeSemanticTokensProvider } from './semanticTokens';
import { PtreeCodeActionProvider } from './codeActions';
import { PtreeFormattingProvider } from './formatter';

/**
 * ptree is a text format for directory-tree representations.
 *
 * This extension provides:
 * - TextMate highlighting (syntaxes/ptree.tmLanguage.json)
 * - A smart FoldingRangeProvider that understands tree depth
 * - Optional linting/validation (ruleset + NAME_TYPES registry)
 * - Convenience commands to copy the path at the cursor
 */

class PtreeFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    _context: vscode.FoldingContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.FoldingRange[]> {
    const ranges: vscode.FoldingRange[] = [];

    const doc = parsePtreeDocument(document.getText());
    const items: Array<{ line: number; depth: number; hasChildren: boolean }> = [];

    if (doc.root) {
      items.push({ line: doc.root.line, depth: -1, hasChildren: doc.nodes.length > 0 });
    }
    for (const node of doc.nodes) {
      items.push({ line: node.line, depth: node.depth, hasChildren: node.hasChildren });
    }

    items.sort((a, b) => a.line - b.line);

    const stack: Array<{ line: number; depth: number; hasChildren: boolean }> = [];

    const closeUntilDepth = (depth: number, endLineExclusive: number) => {
      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        const node = stack.pop()!;
        const endLine = endLineExclusive - 1;
        if (node.hasChildren && node.line < endLine) {
          ranges.push(new vscode.FoldingRange(node.line, endLine, vscode.FoldingRangeKind.Region));
        }
      }
    };

    for (const item of items) {
      if (token.isCancellationRequested) return [];
      closeUntilDepth(item.depth, item.line);
      stack.push(item);
    }

    const lastLine = document.lineCount - 1;
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.hasChildren && node.line < lastLine) {
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
  const doc = parsePtreeDocument(document.getText());
  const targetNode = doc.nodes.find(node => node.line === targetLine);
  if (!targetNode) return null;

  // componentsByDepth[depth] = name
  const componentsByDepth: string[] = [];

  for (const node of doc.nodes) {
    if (node.line > targetLine) break;
    const { base } = stripTrailingMarkers(node.name);
    componentsByDepth[node.depth] = base;
    componentsByDepth.length = node.depth + 1;
  }

  const rawRel = componentsByDepth.join('/');
  const targetHadSlash = targetNode.name.endsWith('/');
  const rel = targetHadSlash ? `${rawRel}/` : rawRel;

  let rootDirectiveValue: string | undefined;
  for (const directive of doc.directiveLines) {
    if (directive.line > targetLine) continue;
    if (directive.key.toLowerCase() === 'root') {
      rootDirectiveValue = directive.value;
    }
  }

  const rootPrefix = (() => {
    if (rootDirectiveValue && rootDirectiveValue.trim().length > 0) {
      return ensureTrailingSlash(rootDirectiveValue.trim());
    }
    if (doc.root && doc.root.value.trim().length > 0 && doc.root.line <= targetLine) {
      const v = doc.root.value.trim();
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

  // Code Actions (Quick Fixes)
  const codeActionProvider = new PtreeCodeActionProvider((document) => {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const workspaceRoot = workspaceFolder?.uri.fsPath;
    const doc = parsePtreeDocument(document.getText());
    const profile = (doc.directives['ptree'] ?? '').trim() === 'spec' ? 'spec' : 'default';
    const { config } = loadEffectiveConfig(context.extensionPath, workspaceRoot, profile);
    return { config, profile };
  });
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: 'ptree' },
      codeActionProvider,
      { providedCodeActionKinds: PtreeCodeActionProvider.providedCodeActionKinds }
    )
  );

  // Document Formatting
  const formattingProvider = new PtreeFormattingProvider((document) => {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const workspaceRoot = workspaceFolder?.uri.fsPath;
    const doc = parsePtreeDocument(document.getText());
    const profile = (doc.directives['ptree'] ?? '').trim() === 'spec' ? 'spec' : 'default';
    const { config } = loadEffectiveConfig(context.extensionPath, workspaceRoot, profile);
    return { config, profile, doc };
  });
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { language: 'ptree' },
      formattingProvider
    )
  );

  // Semantic Tokens (dynamic highlighting based on NAME_TYPES)
  // We register a semantic tokens provider that reads the effective config (default/spec/user)
  // and emits semantic token modifiers like `nt_high_type` / `nt_smol_type`.
  const semanticManager = (() => {
    let currentLegendKey = '';
    let currentProvider: PtreeSemanticTokensProvider | undefined;
    let currentRegistration: vscode.Disposable | undefined;

    const dispose = () => {
      currentRegistration?.dispose();
      currentRegistration = undefined;
      currentProvider = undefined;
    };

    const collectNameTypeIds = (): string[] => {
      const ids = new Set<string>();
      const folders = vscode.workspace.workspaceFolders ?? [];

      // If no workspace folder is open, still include built-in configs.
      const roots = folders.length > 0 ? folders.map(f => f.uri.fsPath) : [undefined];

      for (const root of roots) {
        for (const profile of ['default', 'spec'] as const) {
          try {
            const { config } = loadEffectiveConfig(context.extensionPath, root as any, profile);
            for (const id of Object.keys(config.NAME_TYPES ?? {})) ids.add(id);
          } catch {
            // Ignore config load errors here; validator will surface them.
          }
        }
      }

      return Array.from(ids);
    };

    const register = () => {
      const { legend, knownModifiers, legendKey } = buildSemanticLegend(collectNameTypeIds());

      // If legend hasn't changed, just refresh tokens.
      if (currentProvider && currentLegendKey === legendKey) {
        currentProvider.refresh();
        return;
      }

      dispose();

      currentLegendKey = legendKey;

      const provider = new PtreeSemanticTokensProvider(legend, knownModifiers, (document, parsed) => {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        const workspaceRoot = workspaceFolder?.uri.fsPath;
        const profile = (parsed.directives['ptree'] ?? '').trim() === 'spec' ? 'spec' : 'default';
        const { config } = loadEffectiveConfig(context.extensionPath, workspaceRoot, profile);
        return { config, profile };
      });

      currentProvider = provider;
      currentRegistration = vscode.languages.registerDocumentSemanticTokensProvider(
        { language: 'ptree' },
        provider,
        legend
      );
      context.subscriptions.push(currentRegistration);
    };

    register();

    return { refresh: register, dispose };
  })();
  context.subscriptions.push({ dispose: () => semanticManager.dispose() });

  // If workspace folders change, NAME_TYPES unions may change too.
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      semanticManager.refresh();
    })
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
        d.source = 'ptree';
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

        // Config changed: refresh semantic highlighting too.
        semanticManager.refresh();
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

  // Command: format document
  context.subscriptions.push(
    vscode.commands.registerCommand('ptree.formatDocument', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      if (editor.document.languageId !== 'ptree') {
        vscode.window.showInformationMessage('ptree: Active document is not a ptree file.');
        return;
      }

      await vscode.commands.executeCommand('editor.action.formatDocument');
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

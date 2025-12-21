import * as vscode from 'vscode';
import { PtreeDocument, PtreeNode } from './core/parser';
import { PtreeConfig, NameTypeDef } from './core/config';

export interface PtreeCodeActionProvider extends vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[];
}

/**
 * CodeActionProvider for ptree files.
 * 
 * Provides quick fixes for validator rule violations:
 * - PT002: Add trailing `/` to directories
 * - PT004: Rename to match allowed NAME_TYPE
 * - PT006: Replace spaces with `-` or `_`
 * - PT007: Lowercase file extension
 * - PT008: Normalize mixed delimiters
 */

type ConfigLoader = (document: vscode.TextDocument) => { config: PtreeConfig; profile: string };

export class PtreeCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  constructor(
    private readonly loadConfig: ConfigLoader
  ) {}

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    const { config } = this.loadConfig(document);

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== 'ptree') continue;

      const code = String(diagnostic.code ?? '');
      const line = document.lineAt(diagnostic.range.start.line);

      switch (code) {
        case 'PT002':
          actions.push(...this.fixPT002(document, diagnostic, line));
          break;
        case 'PT004':
          actions.push(...this.fixPT004(document, diagnostic, line, config));
          break;
        case 'PT006':
          actions.push(...this.fixPT006(document, diagnostic, line));
          break;
        case 'PT007':
          actions.push(...this.fixPT007(document, diagnostic, line));
          break;
        case 'PT008':
          actions.push(...this.fixPT008(document, diagnostic, line));
          break;
      }
    }

    return actions;
  }

  /**
   * PT002: Parent node missing trailing `/`
   * Fix: Add `/` to the end of the name
   */
  private fixPT002(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    line: vscode.TextLine
  ): vscode.CodeAction[] {
    const text = line.text;
    
    // Find where to insert the `/` - before any inline metadata
    const metaMatch = text.match(/\s{2,}(#|\[)/);
    const insertPos = metaMatch?.index ?? text.trimEnd().length;
    
    const action = new vscode.CodeAction(
      'Add trailing "/" (directory marker)',
      vscode.CodeActionKind.QuickFix
    );
    
    action.edit = new vscode.WorkspaceEdit();
    action.edit.insert(
      document.uri,
      new vscode.Position(line.lineNumber, insertPos),
      '/'
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    
    return [action];
  }

  /**
   * PT004: Name doesn't match allowed NAME_TYPES
   * Fix: Offer transformations to each allowed NAME_TYPE
   */
  private fixPT004(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    line: vscode.TextLine,
    config: PtreeConfig
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const text = line.text;
    
    // Extract entity type from message: "DIR name", "FILE name", etc.
    const msgMatch = diagnostic.message.match(/^(ROOT|DIR|FILE|META) name "([^"]+)"/);
    if (!msgMatch) return actions;
    
    const [, entity, currentName] = msgMatch;
    const allowed = config.ENTITY_NAME_TYPES?.[entity] ?? [];
    const nameTypes = config.NAME_TYPES ?? {};
    
    // Find the name in the line
    const nameStart = text.indexOf(currentName);
    if (nameStart === -1) return actions;
    
    for (const typeId of allowed) {
      const def = nameTypes[typeId];
      if (!def) continue;
      
      const transformed = this.transformToNameType(currentName, typeId, def);
      if (transformed && transformed !== currentName) {
        const action = new vscode.CodeAction(
          `Rename to "${transformed}" (${typeId})`,
          vscode.CodeActionKind.QuickFix
        );
        
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(
          document.uri,
          new vscode.Range(
            line.lineNumber, nameStart,
            line.lineNumber, nameStart + currentName.length
          ),
          transformed
        );
        action.diagnostics = [diagnostic];
        
        // Mark smol-type as preferred for FILE, High_Type for DIR
        if ((entity === 'FILE' && typeId === 'smol-type') ||
            (entity === 'DIR' && typeId === 'High_Type')) {
          action.isPreferred = true;
        }
        
        actions.push(action);
      }
    }
    
    return actions;
  }

  /**
   * PT006: Spaces in node names
   * Fix: Replace spaces with `-` or `_`
   */
  private fixPT006(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    line: vscode.TextLine
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const range = diagnostic.range;
    const text = document.getText(range);
    
    // Offer both hyphen and underscore replacements
    const withHyphen = text.replace(/ /g, '-');
    const withUnderscore = text.replace(/ /g, '_');
    
    if (withHyphen !== text) {
      const action = new vscode.CodeAction(
        `Replace spaces with "-" → "${withHyphen}"`,
        vscode.CodeActionKind.QuickFix
      );
      action.edit = new vscode.WorkspaceEdit();
      action.edit.replace(document.uri, range, withHyphen);
      action.diagnostics = [diagnostic];
      action.isPreferred = true; // Hyphen is more common in file names
      actions.push(action);
    }
    
    if (withUnderscore !== text) {
      const action = new vscode.CodeAction(
        `Replace spaces with "_" → "${withUnderscore}"`,
        vscode.CodeActionKind.QuickFix
      );
      action.edit = new vscode.WorkspaceEdit();
      action.edit.replace(document.uri, range, withUnderscore);
      action.diagnostics = [diagnostic];
      actions.push(action);
    }
    
    return actions;
  }

  /**
   * PT007: Extension not lowercase
   * Fix: Lowercase the extension
   */
  private fixPT007(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    line: vscode.TextLine
  ): vscode.CodeAction[] {
    const text = line.text;
    
    // Find the extension in the diagnostic message
    const extMatch = diagnostic.message.match(/found: \.([^)]+)\)/);
    if (!extMatch) return [];
    
    const ext = extMatch[1];
    const lowered = ext.toLowerCase();
    
    // Find the extension in the line
    const extPos = text.lastIndexOf('.' + ext);
    if (extPos === -1) return [];
    
    const action = new vscode.CodeAction(
      `Lowercase extension → ".${lowered}"`,
      vscode.CodeActionKind.QuickFix
    );
    
    action.edit = new vscode.WorkspaceEdit();
    action.edit.replace(
      document.uri,
      new vscode.Range(
        line.lineNumber, extPos + 1,
        line.lineNumber, extPos + 1 + ext.length
      ),
      lowered
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    
    return [action];
  }

  /**
   * PT008: Mixed `-` and `_` in same name
   * Fix: Normalize to one delimiter
   */
  private fixPT008(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    line: vscode.TextLine
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const range = diagnostic.range;
    const text = document.getText(range);
    
    // Count which delimiter is more common
    const hyphenCount = (text.match(/-/g) || []).length;
    const underscoreCount = (text.match(/_/g) || []).length;
    
    const withHyphen = text.replace(/_/g, '-');
    const withUnderscore = text.replace(/-/g, '_');
    
    // Offer hyphen normalization
    const hyphenAction = new vscode.CodeAction(
      `Normalize to "-" → "${withHyphen}"`,
      vscode.CodeActionKind.QuickFix
    );
    hyphenAction.edit = new vscode.WorkspaceEdit();
    hyphenAction.edit.replace(document.uri, range, withHyphen);
    hyphenAction.diagnostics = [diagnostic];
    if (hyphenCount > underscoreCount) {
      hyphenAction.isPreferred = true;
    }
    actions.push(hyphenAction);
    
    // Offer underscore normalization
    const underscoreAction = new vscode.CodeAction(
      `Normalize to "_" → "${withUnderscore}"`,
      vscode.CodeActionKind.QuickFix
    );
    underscoreAction.edit = new vscode.WorkspaceEdit();
    underscoreAction.edit.replace(document.uri, range, withUnderscore);
    underscoreAction.diagnostics = [diagnostic];
    if (underscoreCount > hyphenCount) {
      underscoreAction.isPreferred = true;
    }
    actions.push(underscoreAction);
    
    return actions;
  }

  /**
   * Transform a name to match a target NAME_TYPE.
   * 
   * This is where the magic happens - we try to intelligently
   * convert names between conventions.
   */
  private transformToNameType(
    name: string,
    typeId: string,
    def: NameTypeDef
  ): string | null {
    // Strip trailing markers for transformation
    let bare = name;
    let suffix = '';
    if (name.endsWith('//')) {
      bare = name.slice(0, -2);
      suffix = '//';
    } else if (name.endsWith('/')) {
      bare = name.slice(0, -1);
      suffix = '/';
    }
    
    // Split into words (handle various delimiters and camelCase)
    const words = this.splitIntoWords(bare);
    if (words.length === 0) return null;
    
    let result: string;
    
    switch (typeId) {
      case 'SCREAM_TYPE':
        // SCREAMING_SNAKE_CASE
        result = words.map(w => w.toUpperCase()).join('_');
        break;
        
      case 'High_Type':
        // Pascal_Snake_Case
        result = words.map(w => this.capitalize(w)).join('_');
        break;
        
      case 'Cap-Type':
        // Title-Kebab-Case
        result = words.map(w => this.capitalize(w)).join('-');
        break;
        
      case 'CamelType':
        // PascalCase
        result = words.map(w => this.capitalize(w)).join('');
        break;
        
      case 'smol-type':
        // kebab-case
        result = words.map(w => w.toLowerCase()).join('-');
        break;
        
      case 'snake_type':
        // snake_case
        result = words.map(w => w.toLowerCase()).join('_');
        break;
        
      case 'dotfile':
      case 'dotdir':
        // Ensure leading dot
        result = bare.startsWith('.') ? bare : '.' + bare.toLowerCase();
        break;
        
      case 'dot.smol-type':
        // e.g., tsconfig.base
        result = words.map(w => w.toLowerCase()).join('.');
        break;
        
      default:
        return null;
    }
    
    // Verify the result matches the pattern
    const re = new RegExp(def.pattern);
    if (!re.test(result)) {
      // Transformation didn't produce valid output
      return null;
    }
    
    return result + suffix;
  }

  /**
   * Split a name into constituent words.
   * Handles: camelCase, PascalCase, snake_case, kebab-case, etc.
   */
  private splitIntoWords(name: string): string[] {
    // First, replace delimiters with spaces
    let normalized = name
      .replace(/[-_./]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase split
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');  // XMLParser → XML Parser
    
    return normalized
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private capitalize(word: string): string {
    if (word.length === 0) return word;
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  }
}

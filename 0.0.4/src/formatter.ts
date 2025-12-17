import * as vscode from 'vscode';
import { parsePtreeDocument, PtreeDocument, PtreeNode } from './core/parser';
import { PtreeConfig } from './core/config';

/**
 * DocumentFormattingProvider for ptree files.
 * 
 * Applies canonical formatting:
 * - Sorts siblings (directories first, then files, each group alphabetically)
 * - Ensures consistent tree characters (unicode/ascii based on @style)
 * - Ensures directories end with `/`
 * - Ensures root labels end with `//` (in default mode)
 * - Normalizes spacing
 * - In spec mode: ensures canonical header blocks exist
 */

type ConfigLoader = (document: vscode.TextDocument) => { 
  config: PtreeConfig; 
  profile: string;
  doc: PtreeDocument;
};

type Style = 'unicode' | 'ascii';

const GLYPHS = {
  unicode: {
    tee: '├──',
    last: '└──',
    vert: '│   ',
    space: '    '
  },
  ascii: {
    tee: '|--',
    last: '`--',
    vert: '|   ',
    space: '    '
  }
};

export class PtreeFormattingProvider implements vscode.DocumentFormattingEditProvider {
  constructor(
    private readonly loadConfig: ConfigLoader
  ) {}

  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    _options: vscode.FormattingOptions,
    _token: vscode.CancellationToken
  ): vscode.TextEdit[] {
    const { config, profile, doc } = this.loadConfig(document);
    
    const formatted = this.formatDocument(document.getText(), doc, config, profile);
    
    if (formatted === document.getText()) {
      return [];
    }
    
    const fullRange = new vscode.Range(
      0, 0,
      document.lineCount - 1,
      document.lineAt(document.lineCount - 1).text.length
    );
    
    return [vscode.TextEdit.replace(fullRange, formatted)];
  }

  private formatDocument(
    text: string,
    doc: PtreeDocument,
    config: PtreeConfig,
    profile: string
  ): string {
    const lines: string[] = [];
    const style: Style = (doc.directives['style'] ?? config.style ?? 'unicode') === 'ascii' ? 'ascii' : 'unicode';
    const glyph = GLYPHS[style];
    const isSpec = profile === 'spec';
    
    // 1. Format header (directives)
    lines.push(...this.formatHeader(doc, config, isSpec));
    
    // 2. Add blank line after header if we have directives
    if (doc.directiveLines.length > 0) {
      lines.push('');
    }
    
    // 3. Format root label
    if (doc.root) {
      lines.push(this.formatRoot(doc, config, isSpec));
    }
    
    // 4. Build and sort tree structure, then render
    const tree = this.buildTree(doc.nodes);
    lines.push(...this.renderTree(tree, glyph, config));
    
    return lines.join('\n');
  }

  /**
   * Format the header directives.
   * In spec mode, ensure canonical blocks exist.
   */
  private formatHeader(
    doc: PtreeDocument,
    config: PtreeConfig,
    isSpec: boolean
  ): string[] {
    const lines: string[] = [];
    
    if (isSpec) {
      // Canonical spec header
      lines.push('@ptree: spec');
      lines.push('@style: unicode');
      
      const version = doc.directives['version'] ?? '0.0.1';
      lines.push(`@version: ${version}`);
      
      lines.push('@name_type:[');
      lines.push("    ROOT: 'SCREAM_TYPE',");
      lines.push("    DIR: 'High_Type',");
      lines.push("    FILE: 'smol-type'");
      lines.push(']');
      
      lines.push('@seperation_delimiters: [');
      lines.push("    '-',");
      lines.push("    '_',");
      lines.push("    '.'");
      lines.push(']');
    } else {
      // Default mode: preserve existing directives, normalize formatting
      const seen = new Set<string>();
      
      for (const directive of doc.directiveLines) {
        if (seen.has(directive.key.toLowerCase())) continue;
        seen.add(directive.key.toLowerCase());
        
        // Handle multi-line blocks
        if (directive.value.includes('\n') || directive.value.includes('[')) {
          lines.push(directive.raw);
        } else {
          lines.push(`@${directive.key}: ${directive.value}`);
        }
      }
      
      // Ensure @ptree exists
      if (!seen.has('ptree')) {
        lines.unshift('@ptree: 1.0');
      }
      
      // Ensure @style exists
      if (!seen.has('style')) {
        const styleDirective = `@style: ${doc.directives['style'] ?? 'unicode'}`;
        const ptreeIdx = lines.findIndex(l => l.startsWith('@ptree'));
        lines.splice(ptreeIdx + 1, 0, styleDirective);
      }
    }
    
    return lines;
  }

  /**
   * Format the root label.
   */
  private formatRoot(
    doc: PtreeDocument,
    config: PtreeConfig,
    isSpec: boolean
  ): string {
    if (!doc.root) return '';
    
    let rootValue = doc.root.value.trim();
    
    if (isSpec) {
      // Spec mode: PTREE-<version>//
      const version = doc.directives['version'] ?? '0.0.1';
      return `PTREE-${version}//`;
    }
    
    // Default mode: ensure ends with //
    if (!rootValue.endsWith('//') && !rootValue.endsWith('/')) {
      rootValue += '//';
    } else if (rootValue.endsWith('/') && !rootValue.endsWith('//')) {
      // Single slash - might be intentional path, leave as is
    }
    
    return rootValue;
  }

  /**
   * Build a tree structure from flat nodes.
   */
  private buildTree(nodes: PtreeNode[]): TreeNode[] {
    const root: TreeNode[] = [];
    const stack: { depth: number; children: TreeNode[] }[] = [{ depth: -1, children: root }];
    
    for (const node of nodes) {
      const treeNode: TreeNode = {
        name: node.name,
        raw: node.raw,
        depth: node.depth,
        children: [],
        isDir: node.name.endsWith('/') || node.name.endsWith('//') || node.hasChildren
      };
      
      // Pop stack until we find the parent
      while (stack.length > 1 && stack[stack.length - 1].depth >= node.depth) {
        stack.pop();
      }
      
      // Add to parent's children
      stack[stack.length - 1].children.push(treeNode);
      
      // Push this node onto stack for potential children
      stack.push({ depth: node.depth, children: treeNode.children });
    }
    
    return root;
  }

  /**
   * Render the tree with proper sorting and formatting.
   */
  private renderTree(
    nodes: TreeNode[],
    glyph: typeof GLYPHS['unicode'],
    config: PtreeConfig
  ): string[] {
    const lines: string[] = [];
    
    const render = (children: TreeNode[], prefix: string) => {
      // Sort: directories first, then files, each group alphabetically
      const sorted = this.sortNodes(children);
      
      sorted.forEach((node, idx) => {
        const isLast = idx === sorted.length - 1;
        const connector = isLast ? glyph.last : glyph.tee;
        
        // Format the name
        let name = node.name;
        
        // Ensure directories end with /
        if (node.isDir && !name.endsWith('/') && !name.endsWith('//')) {
          name += '/';
        }
        
        // Lowercase file extension
        if (!node.isDir) {
          const lastDot = name.lastIndexOf('.');
          if (lastDot > 0) {
            const base = name.slice(0, lastDot);
            const ext = name.slice(lastDot + 1);
            if (ext !== ext.toLowerCase()) {
              name = `${base}.${ext.toLowerCase()}`;
            }
          }
        }
        
        lines.push(`${prefix}${connector} ${name}`);
        
        // Render children
        if (node.children.length > 0) {
          const childPrefix = prefix + (isLast ? glyph.space : glyph.vert);
          render(node.children, childPrefix);
        }
      });
    };
    
    render(nodes, '');
    return lines;
  }

  /**
   * Sort nodes: directories first, then files, each group alphabetically.
   */
  private sortNodes(nodes: TreeNode[]): TreeNode[] {
    return [...nodes].sort((a, b) => {
      // Directories before files
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      
      // Alphabetically within each group (case-insensitive)
      const aName = this.getSortKey(a.name).toLowerCase();
      const bName = this.getSortKey(b.name).toLowerCase();
      
      return aName.localeCompare(bName);
    });
  }

  /**
   * Get sort key from name (strip trailing markers).
   */
  private getSortKey(name: string): string {
    let key = name;
    if (key.endsWith('//')) key = key.slice(0, -2);
    else if (key.endsWith('/')) key = key.slice(0, -1);
    
    // For files, use stem (before last dot)
    const lastDot = key.lastIndexOf('.');
    if (lastDot > 0) {
      key = key.slice(0, lastDot);
    }
    
    return key;
  }
}

interface TreeNode {
  name: string;
  raw: string;
  depth: number;
  children: TreeNode[];
  isDir: boolean;
}

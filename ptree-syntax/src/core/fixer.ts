import { type PtreeDocument, type PtreeNode } from './parser';
import { type PtreeConfig, type RuleSetting } from './config';

export type FixResult = {
  fixedText: string;
  applied: string[];
};

type FileSplitStrategy = 'lastDot' | 'firstDot';

/**
 * Classify a node as META, DIR, or FILE based on its name suffix.
 */
function classifyNode(name: string): 'META' | 'DIR' | 'FILE' {
  if (name.endsWith('//')) { return 'META'; }
  if (name.endsWith('/')) { return 'DIR'; }
  return 'FILE';
}

/**
 * Strip trailing markers (// or /) from a name.
 */
function stripTrailingMarkers(name: string): string {
  if (name.endsWith('//')) { return name.slice(0, -2); }
  if (name.endsWith('/')) { return name.slice(0, -1); }
  return name;
}

/**
 * Split a file name into stem and extension.
 */
function splitFileParts(fileName: string, strategy: FileSplitStrategy): { stem: string; ext: string | null } {
  if (fileName.startsWith('.') && fileName.indexOf('.', 1) === -1) {
    return { stem: fileName, ext: null };
  }

  const dot = strategy === 'firstDot' ? fileName.indexOf('.') : fileName.lastIndexOf('.');
  if (dot <= 0) { return { stem: fileName, ext: null }; }

  return {
    stem: fileName.slice(0, dot),
    ext: fileName.slice(dot + 1)
  };
}

/**
 * Get the sort key for a node (used for PT009 sorting).
 * Returns the base name without trailing markers and without extension for files.
 */
function getSortKey(node: PtreeNode, fileSplit: FileSplitStrategy): string {
  const kind = classifyNode(node.name);
  const bare = stripTrailingMarkers(node.name);
  return kind === 'FILE' ? splitFileParts(bare, fileSplit).stem : bare;
}

/**
 * Compare two nodes for PT009 sorting.
 * Directories come before files, then alphabetically within each group.
 */
function comparePT009(
  a: PtreeNode,
  b: PtreeNode,
  fileSplit: FileSplitStrategy,
  caseSensitive: boolean
): number {
  const aKind = classifyNode(a.name);
  const bKind = classifyNode(b.name);
  
  // Rank: DIR/META before FILE
  const aRank = aKind === 'FILE' ? 1 : 0;
  const bRank = bKind === 'FILE' ? 1 : 0;
  if (aRank !== bRank) { return aRank - bRank; }

  const ak = getSortKey(a, fileSplit);
  const bk = getSortKey(b, fileSplit);
  const A = caseSensitive ? ak : ak.toLowerCase();
  const B = caseSensitive ? bk : bk.toLowerCase();
  
  if (A < B) { return -1; }
  if (A > B) { return 1; }
  return 0;
}

/**
 * Build a tree structure from flat nodes, grouping children by parent.
 * Returns a map of parent index (or 'ROOT' for top-level) to child indices.
 */
function buildChildrenMap(nodes: PtreeNode[]): Map<string, number[]> {
  const parentStack: number[] = [];
  const childrenByParent = new Map<string, number[]>();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    while (parentStack.length > node.depth) { parentStack.pop(); }

    const parentKey = node.depth === 0 ? 'ROOT' : String(parentStack[node.depth - 1]);
    const arr = childrenByParent.get(parentKey) ?? [];
    arr.push(i);
    childrenByParent.set(parentKey, arr);

    parentStack[node.depth] = i;
    parentStack.length = node.depth + 1;
  }

  return childrenByParent;
}

/**
 * Check if nodes need reordering according to PT009 rules.
 */
function needsReordering(
  nodes: PtreeNode[],
  childrenByParent: Map<string, number[]>,
  fileSplit: FileSplitStrategy,
  caseSensitive: boolean
): boolean {
  for (const [, childIndices] of childrenByParent) {
    for (let j = 1; j < childIndices.length; j++) {
      const prev = childIndices[j - 1];
      const curr = childIndices[j];
      if (comparePT009(nodes[prev], nodes[curr], fileSplit, caseSensitive) > 0) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Recursively collect a subtree starting from a node index.
 * Returns all node indices in the subtree (including the root).
 * Note: Currently unused but kept for potential future use in subtree operations.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function collectSubtree(nodeIndex: number, nodes: PtreeNode[]): number[] {
  const result: number[] = [nodeIndex];
  const rootDepth = nodes[nodeIndex].depth;
  
  for (let i = nodeIndex + 1; i < nodes.length; i++) {
    if (nodes[i].depth <= rootDepth) { break; }
    result.push(i);
  }
  
  return result;
}

function count(s: string, re: RegExp): number {
  return (s.match(re) ?? []).length;
}

function findHeaderEnd(lines: string[]): number {
  // Returns the index of the first non-header line.
  // Header = blank lines, comments, and directive blocks.
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().length === 0) {
      i += 1;
      continue;
    }
    if (/^\s*#/.test(line)) {
      i += 1;
      continue;
    }
    if (/^\s*@/.test(line)) {
      // Directive block may span multiple lines via brackets.
      const m = line.match(/^\s*(@[A-Za-z][A-Za-z0-9_-]*)\s*[:=]?(.*)$/);
      const value = (m?.[2] ?? '').trimEnd();
      let depth = count(value, /\[/g) - count(value, /\]/g);
      i += 1;
      while (depth > 0 && i < lines.length) {
        const nxt = lines[i];
        depth += count(nxt, /\[/g) - count(nxt, /\]/g);
        i += 1;
      }
      continue;
    }
    break;
  }
  return i;
}

function upsertDirectiveLine(lines: string[], key: string, value: string, insertAt: number): { lines: string[]; changed: boolean } {
  const re = new RegExp(`^\\s*@${key}\\b`, 'i');
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      const next = `@${key}: ${value}`;
      if (lines[i].trimEnd() !== next) {
        lines[i] = next;
        return { lines, changed: true };
      }
      return { lines, changed: false };
    }
  }
  lines.splice(insertAt, 0, `@${key}: ${value}`);
  return { lines, changed: true };
}

function hasDirective(lines: string[], key: string): boolean {
  const re = new RegExp(`^\\s*@${key}\\b`, 'i');
  return lines.some(l => re.test(l));
}

function renameDirective(lines: string[], from: string, to: string): boolean {
  const re = new RegExp(`^(\\s*)@${from}\\b`, 'i');
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      lines[i] = lines[i].replace(re, `$1@${to}`);
      return true;
    }
  }
  return false;
}

export function applyCanonicalFixes(text: string, doc: PtreeDocument, config: PtreeConfig): FixResult {
  const lines = text.split(/\r?\n/);
  const applied: string[] = [];

  const isSpec = (config.profile === 'spec') || (config.ptree === 'spec') || ((doc.directives['ptree'] ?? '').trim() === 'spec');

  // Header insertion point
  const headerEnd = findHeaderEnd(lines);

  if (isSpec) {
    // Ensure canonical directives exist.
    {
      const r = upsertDirectiveLine(lines, 'ptree', 'spec', 0);
      if (r.changed) { applied.push('Set @ptree: spec'); }
    }
    {
      const r = upsertDirectiveLine(lines, 'style', 'unicode', 1);
      if (r.changed) { applied.push('Set @style: unicode'); }
    }

    // If @version is missing but root label contains PTREE-<ver>//, infer it.
    let version = (doc.directives['version'] ?? '').trim();
    if (!version && doc.root && doc.root.value.trimEnd().startsWith('PTREE-') && doc.root.value.trimEnd().endsWith('//')) {
      const raw = doc.root.value.trimEnd().slice(0, -2);
      const m = raw.match(/^PTREE[-_]([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?)$/);
      if (m) { version = m[1]; }
    }

    if (version) {
      const r = upsertDirectiveLine(lines, 'version', version, 2);
      if (r.changed) { applied.push('Set @version'); }
    }

    // Insert canonical blocks if missing.
    if (!hasDirective(lines, 'name_type')) {
      const block = [
        '@name_type:[',
        "    ROOT: 'SCREAM_TYPE',",
        "    DIR: 'High_Type',",
        "    FILE: 'smol-type'",
        ']'
      ];
      lines.splice(headerEnd, 0, ...block);
      applied.push('Inserted @name_type block');
    }

    const hasSepCanonical = hasDirective(lines, 'separation_delimiters');
    const hasSepLegacy = hasDirective(lines, 'seperation_delimiters');

    if (!hasSepCanonical && hasSepLegacy) {
      if (renameDirective(lines, 'seperation_delimiters', 'separation_delimiters')) {
        applied.push('Renamed @seperation_delimiters to @separation_delimiters');
      }
    }

    if (!hasSepCanonical && !hasSepLegacy) {
      const block = [
        '@separation_delimiters: [',
        "    '-',",
        "    '_',",
        "    '.'",
        ']'
      ];
      lines.splice(headerEnd, 0, ...block);
      applied.push('Inserted @separation_delimiters list');
    }
  }

  // Root label fix (only in spec mode, and only if we have a declared version).
  if (isSpec) {
    const version = (doc.directives['version'] ?? '').trim();
    if (version && doc.root) {
      const lineNo = doc.root.line;
      const expected = `PTREE-${version}//`;
      const current = lines[lineNo]?.trimEnd() ?? '';
      // Only replace if this line is not a directive or node line.
      if (!/^\s*@/.test(current) && !/^\s*[│|`\u251C\u2514]/.test(current)) {
        if (current.trim() !== expected) {
          lines[lineNo] = expected;
          applied.push('Normalized root label to PTREE-<@version>//');
        }
      }
    }
  }

  // Node fixes: parent directories and extension lowercase.
  // We only apply safe, mechanical fixes that preserve the scaffold and inline metadata.
  for (const node of doc.nodes) {
    const lineNo = node.line;
    const rawLine = lines[lineNo];
    if (rawLine === undefined) { continue; }

    const name = node.name;
    let newName = name;

    // Ensure parent dirs end with `/`
    if (node.hasChildren && !name.endsWith('/')) {
      newName = `${newName}/`;
    }

    // Lowercase extension (last segment) for FILE nodes.
    if (!newName.endsWith('/') && !newName.endsWith('//')) {
      const lastDot = newName.lastIndexOf('.');
      if (lastDot > 0 && lastDot < newName.length - 1) {
        const base = newName.slice(0, lastDot);
        const ext = newName.slice(lastDot + 1);
        const lowered = ext.toLowerCase();
        if (ext !== lowered) {
          newName = `${base}.${lowered}`;
        }
      }
    }

    if (newName !== name) {
      // Replace the name slice in-place; preserve inline metadata outside the parsed name.
      const start = node.startCol;
      const end = node.endCol;
      if (start >= 0 && end >= start && end <= rawLine.length) {
        lines[lineNo] = rawLine.slice(0, start) + newName + rawLine.slice(end);
        applied.push(`Fixed node on line ${lineNo + 1}`);
      }
    }
  }

  // PT009: Sort siblings (directories first, then files, each group alphabetically)
  const pt009Setting = config.RULES?.PT009;
  const pt009Enabled = pt009Setting === true || 
    (typeof pt009Setting === 'object' && pt009Setting.enabled !== false);
  
  if (pt009Enabled && doc.nodes.length > 0) {
    const fileSplit: FileSplitStrategy = (config.FILE_EXTENSION_SPLIT === 'firstDot' ? 'firstDot' : 'lastDot');
    const caseSensitive = typeof pt009Setting === 'object' && 
      typeof (pt009Setting as RuleSetting & { case_sensitive?: boolean }).case_sensitive === 'boolean'
      ? (pt009Setting as RuleSetting & { case_sensitive?: boolean }).case_sensitive!
      : false;
    
    const childrenByParent = buildChildrenMap(doc.nodes);
    
    if (needsReordering(doc.nodes, childrenByParent, fileSplit, caseSensitive)) {
      // Build sorted order by recursively sorting each level
      const sortedNodeIndices = sortNodesRecursively(doc.nodes, childrenByParent, fileSplit, caseSensitive);
      
      // Reorder lines based on sorted node indices
      const nodeLines = doc.nodes.map(n => lines[n.line]);
      for (let i = 0; i < sortedNodeIndices.length; i++) {
        const originalIndex = sortedNodeIndices[i];
        const targetLine = doc.nodes[i].line;
        lines[targetLine] = nodeLines[originalIndex];
      }
      
      applied.push('Sorted nodes according to PT009 (directories first, then files, alphabetically)');
    }
  }

  return { fixedText: lines.join('\n'), applied };
}

/**
 * Sort nodes recursively according to PT009 rules.
 * Returns an array of original node indices in sorted order.
 */
function sortNodesRecursively(
  nodes: PtreeNode[],
  childrenByParent: Map<string, number[]>,
  fileSplit: FileSplitStrategy,
  caseSensitive: boolean
): number[] {
  const result: number[] = [];
  
  // Process top-level nodes first
  const topLevel = childrenByParent.get('ROOT') ?? [];
  const sortedTopLevel = [...topLevel].sort((a, b) => 
    comparePT009(nodes[a], nodes[b], fileSplit, caseSensitive)
  );
  
  // Recursively process each top-level node and its subtree
  for (const nodeIndex of sortedTopLevel) {
    result.push(...collectAndSortSubtree(nodeIndex, nodes, childrenByParent, fileSplit, caseSensitive));
  }
  
  return result;
}

/**
 * Collect and sort a subtree starting from a node.
 * Returns node indices in sorted order.
 */
function collectAndSortSubtree(
  nodeIndex: number,
  nodes: PtreeNode[],
  childrenByParent: Map<string, number[]>,
  fileSplit: FileSplitStrategy,
  caseSensitive: boolean
): number[] {
  const result: number[] = [nodeIndex];
  
  // Get children of this node
  const children = childrenByParent.get(String(nodeIndex)) ?? [];
  if (children.length === 0) {
    return result;
  }
  
  // Sort children
  const sortedChildren = [...children].sort((a, b) => 
    comparePT009(nodes[a], nodes[b], fileSplit, caseSensitive)
  );
  
  // Recursively process each child
  for (const childIndex of sortedChildren) {
    result.push(...collectAndSortSubtree(childIndex, nodes, childrenByParent, fileSplit, caseSensitive));
  }
  
  return result;
}

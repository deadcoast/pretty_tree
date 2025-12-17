import { type PtreeDocument } from './parser';
import { type PtreeConfig } from './config';

export type FixResult = {
  fixedText: string;
  applied: string[];
};

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
      if (r.changed) applied.push('Set @ptree: spec');
    }
    {
      const r = upsertDirectiveLine(lines, 'style', 'unicode', 1);
      if (r.changed) applied.push('Set @style: unicode');
    }

    // If @version is missing but root label contains PTREE-<ver>//, infer it.
    let version = (doc.directives['version'] ?? '').trim();
    if (!version && doc.root && doc.root.value.trimEnd().startsWith('PTREE-') && doc.root.value.trimEnd().endsWith('//')) {
      const raw = doc.root.value.trimEnd().slice(0, -2);
      const m = raw.match(/^PTREE[-_]([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?)$/);
      if (m) version = m[1];
    }

    if (version) {
      const r = upsertDirectiveLine(lines, 'version', version, 2);
      if (r.changed) applied.push('Set @version');
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

    const hasSep = hasDirective(lines, 'seperation_delimiters') || hasDirective(lines, 'separation_delimiters');
    if (!hasSep) {
      const block = [
        '@seperation_delimiters: [',
        "    '-',",
        "    '_',",
        "    '.'",
        ']'
      ];
      lines.splice(headerEnd, 0, ...block);
      applied.push('Inserted @seperation_delimiters list');
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
    if (rawLine === undefined) continue;

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

  return { fixedText: lines.join('\n'), applied };
}

export type PtreeDirective = {
  line: number;
  key: string;
  value: string;
  raw: string;
};

export type PtreeRoot = {
  line: number;
  raw: string;
  value: string;
  kind: 'rootLabel' | 'rootPath';
  startCol: number;
  endCol: number;
};

export type PtreeNode = {
  line: number;
  raw: string;
  depth: number;
  name: string; // includes trailing / or // if present
  startCol: number; // start of name in the raw line
  endCol: number; // end of name in the raw line
  hasChildren: boolean;
};

export type PtreeParseError = {
  line: number;
  message: string;
  startCol?: number;
  endCol?: number;
};

export type PtreeDocument = {
  directives: Record<string, string>;
  directiveLines: PtreeDirective[];
  root?: PtreeRoot;
  nodes: PtreeNode[];
  errors: PtreeParseError[];
};

const DIRECTIVE_RE = /^\s*(@[A-Za-z][A-Za-z0-9_-]*)(?:\s*[:=])?(.*)$/;

// Unicode or ASCII connectors.
const NODE_RE = /^((?:(?:(?:\u2502|\|) {3}| {4})*))((?:\u251C\u2500\u2500|\u2514\u2500\u2500|\|--|`--))\s+(.+)$/;

const SUMMARY_RE = /^\s*\d+\s+directories?,\s+\d+\s+files?\s*$/;

function countDepth(prefix: string): number {
  let depth = 0;
  // Every depth level is 4 chars: either "│   " / "|   " or "    ".
  for (let i = 0; i + 3 < prefix.length; i += 4) {
    depth += 1;
  }
  return depth;
}

function stripInlineMeta(nameAndMaybeMeta: string): string {
  // Remove: "  [..]" and "  #comment" and symlink target.
  // This is intentionally conservative: it only strips if separated by 2+ spaces.
  return nameAndMaybeMeta
    .replace(/\s{2,}(\[.*\])\s*$/, '')
    .replace(/\s{2,}#.*$/, '')
    .split(/\s+->\s+/)[0]
    .trimEnd();
}

function isNodeLine(line: string): boolean {
  return NODE_RE.test(line);
}

function isDirectiveLine(line: string): boolean {
  return /^\s*@/.test(line);
}

function isCommentLine(line: string): boolean {
  return /^\s*#/.test(line);
}

function firstNonWhitespaceColumn(line: string): number {
  const m = line.match(/^\s*/);
  return m ? m[0].length : 0;
}

function classifyRoot(raw: string): 'rootLabel' | 'rootPath' {
  const trimmed = raw.trimEnd();
  if (trimmed.endsWith('//')) return 'rootLabel';
  return 'rootPath';
}

export function parsePtreeDocument(text: string): PtreeDocument {
  const lines = text.split(/\r?\n/);

  const directives: Record<string, string> = {};
  const directiveLines: PtreeDirective[] = [];
  const nodes: PtreeNode[] = [];
  const errors: PtreeParseError[] = [];

  let root: PtreeRoot | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().length === 0) continue;
    if (isCommentLine(line)) continue;

    if (isDirectiveLine(line)) {
      const m = line.match(DIRECTIVE_RE);
      if (m) {
        const startLine = i;
        const keyRaw = m[1].trim();
        let valueRaw = (m[2] ?? '').trimEnd();
        let rawBlock = line;

        // Support multi-line bracket blocks, e.g.:
        //   @name_type:[
        //     ROOT: 'SCREAM_TYPE',
        //     DIR: 'High_Type',
        //     FILE: 'smol-type'
        //   ]
        const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
        let depth = count(valueRaw, /\[/g) - count(valueRaw, /\]/g);
        // If the value ends with '[' (or begins with '[') and the brackets don't close, consume lines until they do.
        if (depth > 0) {
          const parts: string[] = [];
          if (valueRaw.length > 0) parts.push(valueRaw);
          let j = i + 1;
          while (depth > 0 && j < lines.length) {
            const nxt = lines[j];
            parts.push(nxt);
            rawBlock += `\n${nxt}`;
            depth += count(nxt, /\[/g) - count(nxt, /\]/g);
            j += 1;
          }
          valueRaw = parts.join('\n').trimEnd();
          i = j - 1; // skip consumed lines
        }

        const key = keyRaw.slice(1);
        const value = valueRaw.trim();
        directives[key] = value;
        directiveLines.push({ line: startLine, key, value, raw: rawBlock });
      }
      continue;
    }

    // Root line = first non-comment, non-directive, non-node line.
    if (!root && !isNodeLine(line) && !SUMMARY_RE.test(line)) {
      const startCol = firstNonWhitespaceColumn(line);
      const value = line.trimEnd();
      root = {
        line: i,
        raw: line,
        value,
        kind: classifyRoot(value),
        startCol,
        endCol: startCol + value.trim().length
      };
      continue;
    }

    // Node line.
    const nm = line.match(NODE_RE);
    if (nm) {
      const prefix = nm[1] ?? '';
      const remainder = nm[3] ?? '';
      const depth = countDepth(prefix);

      const name = stripInlineMeta(remainder);
      const startCol = line.indexOf(remainder);
      const endCol = startCol + name.length;

      nodes.push({
        line: i,
        raw: line,
        depth,
        name,
        startCol,
        endCol,
        hasChildren: false
      });
      continue;
    }

    // Unknown line; ignore but keep an error to surface if needed.
    errors.push({ line: i, message: 'Unrecognized line (not directive/root/node/summary).' });
  }

  // Compute hasChildren + detect depth jumps.
  for (let idx = 0; idx < nodes.length; idx++) {
    const node = nodes[idx];
    const next = nodes[idx + 1];
    if (!next) continue;

    if (next.depth > node.depth) {
      node.hasChildren = true;

      if (next.depth > node.depth + 1) {
        errors.push({
          line: next.line,
          message: `Indent jump: depth ${node.depth} → ${next.depth} (skipped levels).`,
          startCol: next.startCol,
          endCol: next.endCol
        });
      }
    }
  }

  return { directives, directiveLines, root, nodes, errors };
}
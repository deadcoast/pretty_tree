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
  trailing: string; // raw tail after name (symlink/metadata/comment), includes leading spaces
  symlinkTarget?: string;
  startCol: number; // start of name in the raw line
  endCol: number; // end of name in the raw line
  hasChildren: boolean;
  numeralPrefix?: string; // Roman numeral prefix if present (e.g., "I", "II", "III")
  isIndexFile?: boolean; // True if file name starts with (index) prefix
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

// Roman numeral prefix pattern: [NUMERAL]_[remainder]
const NUMERAL_PREFIX_RE = /^([IVXLCDM]+)_(.+)$/;

// Index file pattern: (index) prefix followed by optional separator and name
const INDEX_FILE_RE = /^\(index\)(?:[-_])?(.*)$/;

/**
 * Parse an index file prefix from a file name.
 * Matches pattern: (index) or (index)-name or (index)_name
 * @param name The file name to parse
 * @returns Object with isIndex flag and remainder (the part after the prefix)
 */
export function parseIndexFile(name: string): { isIndex: boolean; remainder: string } {
  const match = name.match(INDEX_FILE_RE);
  if (match) {
    return { isIndex: true, remainder: match[1] || '' };
  }
  return { isIndex: false, remainder: name };
}

/**
 * Parse a Roman numeral prefix from a directory name.
 * Matches pattern: [NUMERAL]_[remainder] (e.g., "I_Introduction", "II_Content")
 * @param name The directory name to parse
 * @returns Object with numeral (or null if no match) and remainder
 */
export function parseNumeralPrefix(name: string): { numeral: string | null; remainder: string } {
  const match = name.match(NUMERAL_PREFIX_RE);
  if (match) {
    return { numeral: match[1], remainder: match[2] };
  }
  return { numeral: null, remainder: name };
}

/**
 * Validate that a string is a valid Roman numeral (I-M, values 1-1000).
 * Uses the standard Roman numeral format with subtractive notation.
 * @param s The string to validate
 * @returns true if the string is a valid Roman numeral
 */
export function isValidRomanNumeral(s: string): boolean {
  if (!s || s.length === 0) {
    return false;
  }
  // Standard Roman numeral regex supporting values 1-3999
  // M{0,3} = 0-3000
  // (CM|CD|D?C{0,3}) = 0-900 (CM=900, CD=400, D=500, C=100)
  // (XC|XL|L?X{0,3}) = 0-90 (XC=90, XL=40, L=50, X=10)
  // (IX|IV|V?I{0,3}) = 0-9 (IX=9, IV=4, V=5, I=1)
  const ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  return ROMAN_RE.test(s) && s.length > 0;
}

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

function splitNodeRemainder(remainder: string): { name: string; trailing: string; symlinkTarget?: string } {
  // Split into name and trailing metadata/comment/symlink suffix.
  // Metadata/comments require 2+ spaces before "#" or "[".
  const metaMatch = remainder.match(/\s{2,}(#|\[)/);
  const metaIndex = metaMatch?.index ?? -1;
  const beforeMeta = metaIndex >= 0 ? remainder.slice(0, metaIndex) : remainder;
  const metaSuffix = metaIndex >= 0 ? remainder.slice(metaIndex) : '';

  const arrowToken = ' -> ';
  const arrowIdx = beforeMeta.indexOf(arrowToken);
  if (arrowIdx !== -1) {
    const name = beforeMeta.slice(0, arrowIdx).trimEnd();
    const symlinkPart = beforeMeta.slice(arrowIdx);
    const target = beforeMeta.slice(arrowIdx + arrowToken.length).trim();
    return {
      name,
      trailing: `${symlinkPart}${metaSuffix}`,
      symlinkTarget: target.length > 0 ? target : undefined
    };
  }

  return {
    name: beforeMeta.trimEnd(),
    trailing: metaSuffix
  };
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

      const { name, trailing, symlinkTarget } = splitNodeRemainder(remainder);
      const startCol = line.indexOf(remainder);
      const endCol = startCol + name.length;

      // Check for Roman numeral prefix in directory names
      let numeralPrefix: string | undefined;
      if (name.endsWith('/')) {
        // Strip trailing slash for numeral parsing
        const dirName = name.slice(0, -1);
        const { numeral } = parseNumeralPrefix(dirName);
        if (numeral && isValidRomanNumeral(numeral)) {
          numeralPrefix = numeral;
        }
      }

      // Check for index file prefix in file names (not directories)
      let isIndexFile: boolean | undefined;
      if (!name.endsWith('/') && !name.endsWith('//')) {
        const { isIndex } = parseIndexFile(name);
        if (isIndex) {
          isIndexFile = true;
        }
      }

      nodes.push({
        line: i,
        raw: line,
        depth,
        name,
        trailing,
        symlinkTarget,
        startCol,
        endCol,
        hasChildren: false,
        numeralPrefix,
        isIndexFile
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

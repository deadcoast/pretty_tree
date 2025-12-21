export type PtreeDirective = {
  line: number;
  key: string;
  value: string;
  raw: string;
  // Position fields for round-trip support
  keyStartCol: number;
  keyEndCol: number;
  valueStartCol: number;
  valueEndCol: number;
  separatorChar: ':' | '=' | null;
};

export type PtreeRoot = {
  line: number;
  raw: string;
  value: string;
  kind: 'rootLabel' | 'rootPath';
  startCol: number;
  endCol: number;
};

/**
 * Inline metadata structure for bracket attributes and inline comments.
 * Metadata appears after two or more spaces following the node name.
 */
export type InlineMetadata = {
  /** Bracket attributes like [key=value, key2=value2] */
  attributes?: Record<string, string>;
  /** Inline comment text (without the leading #) */
  comment?: string;
  /** Start column of the metadata in the raw line */
  startCol?: number;
  /** End column of the metadata in the raw line */
  endCol?: number;
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
  stem?: string; // For FILE entities: the base name without extension(s)
  extension?: string; // For FILE entities: the full extension string (e.g., "ts", "test.ts", "tar.gz")
  inlineMetadata?: InlineMetadata; // Bracket attributes or inline comments after 2+ spaces
};

export type PtreeParseError = {
  line: number;
  message: string;
  startCol?: number;
  endCol?: number;
};

/**
 * Represents a comment line in the ptree document.
 * Used for round-trip support to preserve comments.
 */
export type CommentLine = {
  line: number;
  raw: string;
  startCol: number;
  endCol: number;
};

/**
 * Represents a summary line in the ptree document.
 * Summary lines are typically appended by tree generators (e.g., `tree` command)
 * and follow the pattern "N directories, M files".
 */
export type SummaryLine = {
  line: number;
  raw: string;
  directories: number;
  files: number;
  startCol: number;
  endCol: number;
};

export type PtreeDocument = {
  directives: Record<string, string>;
  directiveLines: PtreeDirective[];
  root?: PtreeRoot;
  nodes: PtreeNode[];
  errors: PtreeParseError[];
  /** Line numbers of blank lines for round-trip support */
  blankLines: number[];
  /** Comment lines for round-trip support */
  commentLines: CommentLine[];
  /** Optional summary line (e.g., "8 directories, 20 files") */
  summaryLine?: SummaryLine;
};

const DIRECTIVE_RE = /^\s*(@[A-Za-z][A-Za-z0-9_-]*)(?:\s*[:=])?(.*)$/;

// Roman numeral prefix pattern: [NUMERAL]_[remainder]
const NUMERAL_PREFIX_RE = /^([IVXLCDM]+)_(.+)$/;

/**
 * Split a file name into stem and extension(s).
 * Supports both firstDot and lastDot strategies.
 * Handles dotfiles correctly (e.g., .gitignore is treated as stem with no extension).
 * 
 * @param fileName The file name to split
 * @param strategy 'firstDot' splits at first dot, 'lastDot' splits at last dot
 * @returns Object with stem and extensions array
 * 
 * Examples:
 * - splitFileExtension('parser.ts', 'lastDot') => { stem: 'parser', extensions: ['ts'] }
 * - splitFileExtension('parser.test.ts', 'firstDot') => { stem: 'parser', extensions: ['test', 'ts'] }
 * - splitFileExtension('parser.test.ts', 'lastDot') => { stem: 'parser.test', extensions: ['ts'] }
 * - splitFileExtension('.gitignore', 'lastDot') => { stem: '.gitignore', extensions: [] }
 * - splitFileExtension('archive.tar.gz', 'firstDot') => { stem: 'archive', extensions: ['tar', 'gz'] }
 */
export function splitFileExtension(
  fileName: string,
  strategy: 'firstDot' | 'lastDot'
): { stem: string; extensions: string[] } {
  // Handle empty or whitespace-only input
  if (!fileName || fileName.trim().length === 0) {
    return { stem: fileName, extensions: [] };
  }

  // Handle dotfiles: files that start with a dot and have no other dots
  // e.g., .gitignore, .env, .editorconfig
  if (fileName.startsWith('.') && fileName.indexOf('.', 1) === -1) {
    return { stem: fileName, extensions: [] };
  }

  // Find the split point based on strategy
  const dotIndex = strategy === 'firstDot'
    ? fileName.indexOf('.')
    : fileName.lastIndexOf('.');

  // No dot found, or dot is at position 0 (dotfile case already handled above)
  if (dotIndex <= 0) {
    return { stem: fileName, extensions: [] };
  }

  const stem = fileName.slice(0, dotIndex);
  const extPart = fileName.slice(dotIndex + 1);

  // Split extensions by dots
  const extensions = extPart.length > 0 ? extPart.split('.') : [];

  return { stem, extensions };
}

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

const SUMMARY_RE = /^\s*\d+\s+director(?:y|ies),\s+\d+\s+files?\s*$/;

/**
 * Parse a summary line like "N directories, M files" or "1 directory, 1 file".
 * @param line The line to parse
 * @returns Object with directories and files counts, or null if not a summary line
 */
export function parseSummaryLine(line: string): { directories: number; files: number } | null {
  const match = line.trim().match(/^(\d+)\s+director(?:y|ies),\s+(\d+)\s+files?$/i);
  if (match) {
    return {
      directories: parseInt(match[1], 10),
      files: parseInt(match[2], 10)
    };
  }
  return null;
}

function countDepth(prefix: string): number {
  let depth = 0;
  // Every depth level is 4 chars: either "│   " / "|   " or "    ".
  for (let i = 0; i + 3 < prefix.length; i += 4) {
    depth += 1;
  }
  return depth;
}

/**
 * Parse bracket attributes from a string like "[key=value, key2=value2]"
 * @param attrString The string inside the brackets (without the brackets)
 * @returns Record of key-value pairs
 */
function parseBracketAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Split by comma, handling potential whitespace
  const pairs = attrString.split(',');
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) {continue;}
    
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key) {
        attrs[key] = value;
      }
    } else {
      // Key without value (boolean flag)
      if (trimmed) {
        attrs[trimmed] = '';
      }
    }
  }
  return attrs;
}

/**
 * Parse inline metadata from the trailing part of a node line.
 * Metadata must be preceded by 2+ spaces.
 * Supports:
 * - Bracket attributes: [key=value, key2=value2]
 * - Inline comments: # comment text
 * - Both: [key=value]  # comment
 * 
 * @param trailing The trailing part of the line after the name
 * @param trailingStartCol The column where trailing starts in the raw line
 * @returns Parsed inline metadata or undefined if none found
 */
export function parseInlineMetadata(
  trailing: string,
  trailingStartCol: number
): InlineMetadata | undefined {
  if (!trailing || trailing.trim().length === 0) {
    return undefined;
  }

  // Look for metadata patterns (must be preceded by 2+ spaces in the original trailing)
  // The trailing already starts after the name, so we check if it starts with 2+ spaces
  const leadingSpaceMatch = trailing.match(/^(\s{2,})/);
  if (!leadingSpaceMatch) {
    return undefined;
  }

  const afterSpaces = trailing.slice(leadingSpaceMatch[1].length);
  if (!afterSpaces.trim()) {
    return undefined;
  }

  const metadata: InlineMetadata = {};
  let currentPos = leadingSpaceMatch[1].length;
  let remaining = afterSpaces;

  // Try to parse bracket attributes first: [key=value, key2=value2]
  const bracketMatch = remaining.match(/^\[([^\]]*)\]/);
  if (bracketMatch) {
    metadata.attributes = parseBracketAttributes(bracketMatch[1]);
    metadata.startCol = trailingStartCol + currentPos;
    currentPos += bracketMatch[0].length;
    remaining = remaining.slice(bracketMatch[0].length);
    
    // Check for inline comment after bracket attributes
    const commentAfterBracket = remaining.match(/^\s{2,}#\s*(.*)/);
    if (commentAfterBracket) {
      metadata.comment = commentAfterBracket[1];
      metadata.endCol = trailingStartCol + trailing.length;
    } else {
      metadata.endCol = trailingStartCol + currentPos;
    }
    
    return metadata;
  }

  // Try to parse inline comment: # comment text
  const commentMatch = remaining.match(/^#\s*(.*)/);
  if (commentMatch) {
    metadata.comment = commentMatch[1];
    metadata.startCol = trailingStartCol + currentPos;
    metadata.endCol = trailingStartCol + trailing.length;
    return metadata;
  }

  return undefined;
}

function splitNodeRemainder(remainder: string): { name: string; trailing: string; symlinkTarget?: string; inlineMetadata?: InlineMetadata } {
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
    
    // Parse inline metadata from the metaSuffix (if present)
    // For symlinks, the trailing includes both the symlink part and metadata
    const inlineMetadata = metaSuffix.length > 0 
      ? parseInlineMetadata(metaSuffix, 0) // startCol will be adjusted by caller
      : undefined;
    
    return {
      name,
      trailing: `${symlinkPart}${metaSuffix}`,
      symlinkTarget: target.length > 0 ? target : undefined,
      inlineMetadata
    };
  }

  // Parse inline metadata from the metaSuffix (if present)
  const inlineMetadata = metaSuffix.length > 0 
    ? parseInlineMetadata(metaSuffix, 0) // startCol will be adjusted by caller
    : undefined;

  return {
    name: beforeMeta.trimEnd(),
    trailing: metaSuffix,
    inlineMetadata
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
  if (trimmed.endsWith('//')) {return 'rootLabel';}
  return 'rootPath';
}

export function parsePtreeDocument(text: string): PtreeDocument {
  const lines = text.split(/\r?\n/);

  const directives: Record<string, string> = {};
  const directiveLines: PtreeDirective[] = [];
  const nodes: PtreeNode[] = [];
  const errors: PtreeParseError[] = [];
  const blankLines: number[] = [];
  const commentLines: CommentLine[] = [];
  let summaryLine: SummaryLine | undefined;

  let root: PtreeRoot | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track blank lines for round-trip support
    if (line.trim().length === 0) {
      blankLines.push(i);
      continue;
    }
    
    // Track comment lines for round-trip support
    if (isCommentLine(line)) {
      const startCol = firstNonWhitespaceColumn(line);
      const trimmed = line.trim();
      commentLines.push({
        line: i,
        raw: line,
        startCol,
        endCol: startCol + trimmed.length
      });
      continue;
    }
    
    // Check for summary line (e.g., "8 directories, 20 files")
    if (SUMMARY_RE.test(line)) {
      const parsed = parseSummaryLine(line);
      if (parsed) {
        const startCol = firstNonWhitespaceColumn(line);
        const trimmed = line.trim();
        summaryLine = {
          line: i,
          raw: line,
          directories: parsed.directories,
          files: parsed.files,
          startCol,
          endCol: startCol + trimmed.length
        };
      }
      continue;
    }

    if (isDirectiveLine(line)) {
      const m = line.match(DIRECTIVE_RE);
      if (m) {
        const startLine = i;
        const keyRaw = m[1].trim();
        let valueRaw = (m[2] ?? '').trimEnd();
        let rawBlock = line;

        // Calculate position fields for round-trip support
        const keyStartCol = line.indexOf(keyRaw);
        const keyEndCol = keyStartCol + keyRaw.length;
        
        // Find separator character (: or =)
        let separatorChar: ':' | '=' | null = null;
        const afterKey = line.slice(keyEndCol);
        const sepMatch = afterKey.match(/^\s*([:=])/);
        if (sepMatch) {
          separatorChar = sepMatch[1] as ':' | '=';
        }
        
        // Calculate value start position
        let valueStartCol = keyEndCol;
        if (sepMatch) {
          valueStartCol = keyEndCol + afterKey.indexOf(sepMatch[1]) + 1;
          // Skip whitespace after separator
          const afterSep = line.slice(valueStartCol);
          const wsMatch = afterSep.match(/^\s*/);
          if (wsMatch) {
            valueStartCol += wsMatch[0].length;
          }
        }

        // Support multi-line bracket blocks, e.g.:
        //   @name_type:[
        //     ROOT: 'SCREAM_TYPE',
        //     DIR: 'High_Type',
        //     FILE: 'smol-type'
        //   ]
        const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
        let bracketDepth = count(valueRaw, /\[/g) - count(valueRaw, /\]/g);
        const openingLine = startLine; // Track opening line for error reporting
        
        // If the value ends with '[' (or begins with '[') and the brackets don't close, consume lines until they do.
        if (bracketDepth > 0) {
          const parts: string[] = [];
          if (valueRaw.length > 0) {
            parts.push(valueRaw);
          }
          let j = i + 1;
          while (bracketDepth > 0 && j < lines.length) {
            const nxt = lines[j];
            parts.push(nxt);
            rawBlock += `\n${nxt}`;
            bracketDepth += count(nxt, /\[/g) - count(nxt, /\]/g);
            j += 1;
          }
          valueRaw = parts.join('\n').trimEnd();
          i = j - 1; // skip consumed lines
          
          // Report unclosed bracket block with opening line location
          if (bracketDepth > 0) {
            errors.push({
              line: openingLine,
              message: `Unclosed bracket block starting at line ${openingLine + 1}. Expected ${bracketDepth} more closing bracket(s).`,
              startCol: keyStartCol,
              endCol: line.length
            });
          }
        }

        const key = keyRaw.slice(1);
        const value = valueRaw.trim();
        
        // Calculate value end position (for single-line directives, it's the end of value on the line)
        const valueEndCol = rawBlock.includes('\n') 
          ? rawBlock.length  // Multi-line: end of entire block
          : valueStartCol + value.length;
        
        directives[key] = value;
        directiveLines.push({ 
          line: startLine, 
          key, 
          value, 
          raw: rawBlock,
          keyStartCol,
          keyEndCol,
          valueStartCol,
          valueEndCol,
          separatorChar
        });
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

      const { name, trailing, symlinkTarget, inlineMetadata: parsedMetadata } = splitNodeRemainder(remainder);
      const startCol = line.indexOf(remainder);
      const endCol = startCol + name.length;

      // Adjust inline metadata column positions relative to the line
      let inlineMetadata: InlineMetadata | undefined;
      if (parsedMetadata) {
        inlineMetadata = {
          ...parsedMetadata,
          startCol: parsedMetadata.startCol !== undefined ? endCol + parsedMetadata.startCol : undefined,
          endCol: parsedMetadata.endCol !== undefined ? endCol + parsedMetadata.endCol : undefined
        };
      }

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
      let stem: string | undefined;
      let extension: string | undefined;
      
      if (!name.endsWith('/') && !name.endsWith('//')) {
        const { isIndex } = parseIndexFile(name);
        if (isIndex) {
          isIndexFile = true;
        }
        
        // Parse stem and extension for FILE entities
        // Use lastDot as default strategy (can be overridden by config in validator)
        const { stem: parsedStem, extensions } = splitFileExtension(name, 'lastDot');
        if (parsedStem !== name) {
          stem = parsedStem;
          extension = extensions.length > 0 ? extensions.join('.') : undefined;
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
        isIndexFile,
        stem,
        extension,
        inlineMetadata
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
    if (!next) {continue;}

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

  return { directives, directiveLines, root, nodes, errors, blankLines, commentLines, summaryLine };
}

/**
 * Serialize a PtreeDocument AST back to text, preserving original formatting.
 * This enables round-trip parsing: parse(print(doc)) should produce an equivalent AST.
 * 
 * The function uses the `raw` field from each element to preserve exact formatting,
 * including whitespace, comments, and original line structure.
 * 
 * @param doc The PtreeDocument to serialize
 * @param options Optional configuration for printing
 * @returns The serialized text representation
 */
export function printPtreeDocument(
  doc: PtreeDocument,
  options?: {
    /** If true, include blank lines from the original document (default: true) */
    preserveBlankLines?: boolean;
    /** If true, include comment lines from the original document (default: true) */
    preserveComments?: boolean;
  }
): string {
  const preserveBlankLines = options?.preserveBlankLines ?? true;
  const preserveComments = options?.preserveComments ?? true;
  
  // Build a map of line numbers to their content for proper ordering
  const lineMap = new Map<number, string>();
  
  // Add directive lines
  for (const directive of doc.directiveLines) {
    // For multi-line directives, the raw field contains all lines joined with \n
    lineMap.set(directive.line, directive.raw);
  }
  
  // Add root line
  if (doc.root) {
    lineMap.set(doc.root.line, doc.root.raw);
  }
  
  // Add node lines
  for (const node of doc.nodes) {
    lineMap.set(node.line, node.raw);
  }
  
  // Add blank lines
  if (preserveBlankLines) {
    for (const lineNum of doc.blankLines) {
      lineMap.set(lineNum, '');
    }
  }
  
  // Add comment lines
  if (preserveComments) {
    for (const comment of doc.commentLines) {
      lineMap.set(comment.line, comment.raw);
    }
  }
  
  // Add summary line (if present)
  if (doc.summaryLine) {
    lineMap.set(doc.summaryLine.line, doc.summaryLine.raw);
  }
  
  // Sort by line number and build output
  const sortedLineNumbers = Array.from(lineMap.keys()).sort((a, b) => a - b);
  
  const lines: string[] = [];
  for (const lineNum of sortedLineNumbers) {
    const content = lineMap.get(lineNum);
    if (content !== undefined) {
      // Handle multi-line content (like bracket block directives)
      if (content.includes('\n')) {
        lines.push(...content.split('\n'));
      } else {
        lines.push(content);
      }
    }
  }
  
  return lines.join('\n');
}

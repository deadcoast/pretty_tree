# Design Document: ptree Completion

## Overview

This design document outlines the technical approach for completing the ptree (Pretty Tree) language specification and implementation to v1.0.0 status. The primary focus is on completing the NAME_TYPE registry, adding missing entity types (EXT, NUMERAL), implementing all UniRules, and ensuring parser round-trip fidelity.

The design follows the existing architecture patterns established in the codebase while extending them to support the full specification from the legacy design documents.

## Architecture

The ptree system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                        │
│  (extension.ts, semanticTokens.ts, codeActions.ts, etc.)    │
├─────────────────────────────────────────────────────────────┤
│                         CLI                                 │
│                      (cli.ts)                               │
├─────────────────────────────────────────────────────────────┤
│                      Core Layer                             │
│   ┌──────────┐  ┌───────────┐  ┌────────┐  ┌───────────┐    │
│   │  Parser  │  │ Validator │  │ Fixer  │  │ Formatter │    │
│   └──────────┘  └───────────┘  └────────┘  └───────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Config Layer                             │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │  Profile Loader  │  │  NAME_TYPE Registry (JSON)      │  │
│  └──────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **NAME_TYPE as Central Registry**: All naming conventions are defined in `config/*.json` files, making them the single source of truth for validation, highlighting, and documentation.

2. **Entity-Based Classification**: Nodes are classified into entities (ROOT, DIR, FILE, EXT, META) with each entity having configurable NAME_TYPE rules.

3. **Profile-Based Configuration**: Two built-in profiles (default, spec) with user override capability via workspace config files.

4. **Round-Trip Parser**: The parser must preserve enough information to regenerate the original document.

## Components and Interfaces

### 1. Extended NAME_TYPE Registry

**Location:** `config/ptree.default-config.json`, `config/ptree.spec-config.json`

```typescript
// Extended NameTypeDef interface
export type NameTypeDef = {
  description: string;
  word_delimiter: string | null;
  allowed_version_delimiters: string[];
  pattern: string;
  examples: string[];
  with_number_examples: string[];
  // New: support for compound patterns (e.g., NUMERAL + NAME_TYPE)
  prefix_pattern?: string;
  suffix_pattern?: string;
};

// New NAME_TYPEs to add:
const NUMERAL_TYPE: NameTypeDef = {
  description: "Roman numeral prefix (I, II, III, IV, V, etc.)",
  word_delimiter: null,
  allowed_version_delimiters: ["-", "_"],
  pattern: "^[IVXLCDM]+$",
  examples: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"],
  with_number_examples: []
};
```

### 2. Entity Classification System

**Location:** `src/core/parser.ts`, `src/core/validator.ts`

```typescript
// Extended entity types
export type EntityType = 'ROOT' | 'DIR' | 'FILE' | 'EXT' | 'META' | 'NUMERAL';

// Inline metadata structure
export type InlineMetadata = {
  attributes?: Record<string, string>;
  comment?: string;
};

// Extended PtreeNode with entity classification
export type PtreeNode = {
  line: number;
  raw: string;
  depth: number;
  name: string;
  trailing: string;
  symlinkTarget?: string;
  startCol: number;
  endCol: number;
  hasChildren: boolean;
  // New fields
  entity: EntityType;
  stem?: string;           // For FILE: name without extension
  extension?: string;      // For FILE: the extension(s)
  numeralPrefix?: string;  // For NUMERAL-prefixed dirs: the Roman numeral
  isIndexFile?: boolean;   // True if name starts with (index)
  inlineMetadata?: InlineMetadata;  // Bracket attributes or inline comments
};

// Summary line structure
export type SummaryLine = {
  line: number;
  raw: string;
  directories: number;
  files: number;
};

// Extended document structure
export type PtreeDocument = {
  directiveLines: PtreeDirective[];
  root: PtreeNode | null;
  nodes: PtreeNode[];
  errors: ParseError[];
  blankLines: number[];      // Line numbers of blank lines
  commentLines: CommentLine[]; // Comment lines with positions
  summaryLine?: SummaryLine;  // Optional summary line
};
```

### 3. Index File Recognition

**Location:** `src/core/parser.ts`

```typescript
// Index file pattern: (index) prefix followed by optional separator and name
const INDEX_FILE_RE = /^\(index\)(?:[-_])?(.*)$/;

function parseIndexFile(name: string): { isIndex: boolean; remainder: string } {
  const match = name.match(INDEX_FILE_RE);
  if (match) {
    return { isIndex: true, remainder: match[1] || '' };
  }
  return { isIndex: false, remainder: name };
}
```

### 4. Roman Numeral Parser

**Location:** `src/core/parser.ts`

```typescript
// Roman numeral pattern with underscore separator
const NUMERAL_PREFIX_RE = /^([IVXLCDM]+)_(.+)$/;

function parseNumeralPrefix(name: string): { numeral: string | null; remainder: string } {
  const match = name.match(NUMERAL_PREFIX_RE);
  if (match) {
    return { numeral: match[1], remainder: match[2] };
  }
  return { numeral: null, remainder: name };
}

function isValidRomanNumeral(s: string): boolean {
  // Validate Roman numeral format (I-M, 1-1000)
  const ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  return ROMAN_RE.test(s);
}
```

### 5. Extension Parser

**Location:** `src/core/parser.ts`

```typescript
// Split file into stem and extension(s)
function splitFileExtension(
  fileName: string, 
  strategy: 'firstDot' | 'lastDot'
): { stem: string; extensions: string[] } {
  // Handle dotfiles
  if (fileName.startsWith('.') && fileName.indexOf('.', 1) === -1) {
    return { stem: fileName, extensions: [] };
  }
  
  const dot = strategy === 'firstDot' 
    ? fileName.indexOf('.') 
    : fileName.lastIndexOf('.');
    
  if (dot <= 0) {
    return { stem: fileName, extensions: [] };
  }
  
  const stem = fileName.slice(0, dot);
  const extPart = fileName.slice(dot + 1);
  const extensions = extPart.split('.');
  
  return { stem, extensions };
}
```

### 6. UniRule Validator

**Location:** `src/core/validator.ts`

```typescript
// UniRule_1: Version delimiter must differ from word delimiter
function validateUniRule1(
  name: string,
  nameTypeDef: NameTypeDef,
  versionDelimiter: string | null
): LintMessage | null {
  if (!versionDelimiter || !nameTypeDef.word_delimiter) {
    return null; // No conflict possible
  }
  
  if (versionDelimiter === nameTypeDef.word_delimiter) {
    return {
      code: 'PT005',
      severity: 'error',
      message: `Version delimiter "${versionDelimiter}" must not match word delimiter "${nameTypeDef.word_delimiter}" (UniRule_1)`,
      // ... location info
    };
  }
  
  if (!nameTypeDef.allowed_version_delimiters.includes(versionDelimiter)) {
    return {
      code: 'PT005',
      severity: 'error',
      message: `Version delimiter "${versionDelimiter}" is not allowed for this NAME_TYPE`,
      // ... location info
    };
  }
  
  return null;
}

// UniRule_5: No mixing - and _ in same bare name
function validateUniRule5(bareName: string): LintMessage | null {
  const hasHyphen = bareName.includes('-');
  const hasUnderscore = bareName.includes('_');
  
  if (hasHyphen && hasUnderscore) {
    return {
      code: 'PT008',
      severity: 'warning',
      message: "Do not mix '-' and '_' in the same bare name (UniRule_5)",
      // ... location info
    };
  }
  
  return null;
}
```

### 7. Round-Trip Parser Enhancement

**Location:** `src/core/parser.ts`

```typescript
// Enhanced AST node with position preservation
export type PtreeDirective = {
  line: number;
  key: string;
  value: string;
  raw: string;
  // New: preserve exact formatting
  keyStartCol: number;
  keyEndCol: number;
  valueStartCol: number;
  valueEndCol: number;
  separatorChar: ':' | '=';
};

// Pretty-printer for round-trip
export function printPtreeDocument(doc: PtreeDocument): string {
  const lines: string[] = [];
  
  // Print directives preserving original formatting
  for (const directive of doc.directiveLines) {
    lines.push(directive.raw);
  }
  
  // Print root
  if (doc.root) {
    lines.push(doc.root.raw);
  }
  
  // Print nodes preserving scaffold and metadata
  for (const node of doc.nodes) {
    lines.push(node.raw);
  }
  
  return lines.join('\n');
}
```

### 8. Symlink Parser

**Location:** `src/core/parser.ts`

```typescript
// Symlink pattern: name -> target
const SYMLINK_RE = /^(.+?)\s+->\s+(.+)$/;

function parseSymlink(nameWithTarget: string): { name: string; target: string | null } {
  const match = nameWithTarget.match(SYMLINK_RE);
  if (match) {
    return { name: match[1], target: match[2] };
  }
  return { name: nameWithTarget, target: null };
}
```

### 9. Inline Metadata Parser

**Location:** `src/core/parser.ts`

```typescript
// Inline metadata patterns (require 2+ spaces before metadata)
const BRACKET_ATTR_RE = /^(.+?)\s{2,}\[([^\]]+)\](.*)$/;
const INLINE_COMMENT_RE = /^(.+?)\s{2,}#\s*(.*)$/;

export type InlineMetadata = {
  attributes?: Record<string, string>;
  comment?: string;
};

function parseInlineMetadata(line: string): { name: string; metadata: InlineMetadata | null } {
  // Try bracket attributes first
  const attrMatch = line.match(BRACKET_ATTR_RE);
  if (attrMatch) {
    const attrs: Record<string, string> = {};
    attrMatch[2].split(',').forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim());
      if (key) attrs[key] = value || '';
    });
    return { name: attrMatch[1], metadata: { attributes: attrs } };
  }
  
  // Try inline comment
  const commentMatch = line.match(INLINE_COMMENT_RE);
  if (commentMatch) {
    return { name: commentMatch[1], metadata: { comment: commentMatch[2] } };
  }
  
  return { name: line, metadata: null };
}
```

### 10. Summary Line Parser

**Location:** `src/core/parser.ts`

```typescript
// Summary line pattern: "N directories, M files"
const SUMMARY_RE = /^(\d+)\s+director(?:y|ies),\s+(\d+)\s+files?$/i;

function parseSummaryLine(line: string): { directories: number; files: number } | null {
  const match = line.trim().match(SUMMARY_RE);
  if (match) {
    return { directories: parseInt(match[1], 10), files: parseInt(match[2], 10) };
  }
  return null;
}
```

## Data Models

### Extended Configuration Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "NAME_TYPES": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "word_delimiter": { "type": ["string", "null"] },
          "allowed_version_delimiters": {
            "type": "array",
            "items": { "type": "string" }
          },
          "pattern": { "type": "string" },
          "prefix_pattern": { "type": "string" },
          "examples": { "type": "array", "items": { "type": "string" } },
          "with_number_examples": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["pattern", "word_delimiter", "allowed_version_delimiters"]
      }
    },
    "ENTITY_NAME_TYPES": {
      "type": "object",
      "properties": {
        "ROOT": { "type": "array", "items": { "type": "string" } },
        "DIR": { "type": "array", "items": { "type": "string" } },
        "FILE": { "type": "array", "items": { "type": "string" } },
        "EXT": { "type": "array", "items": { "type": "string" } },
        "META": { "type": "array", "items": { "type": "string" } },
        "NUMERAL": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

### New NAME_TYPE Definitions

```json
{
  "NUMERAL": {
    "description": "Roman numeral (I, II, III, IV, V, VI, VII, VIII, IX, X, etc.)",
    "word_delimiter": null,
    "allowed_version_delimiters": ["-", "_"],
    "pattern": "^[IVXLCDM]+$",
    "examples": ["I", "II", "III", "IV", "V", "X", "L", "C", "D", "M"],
    "with_number_examples": []
  },
  "index-type": {
    "description": "Index file prefix pattern: (index) or (index)-name",
    "word_delimiter": "-",
    "allowed_version_delimiters": ["_"],
    "pattern": "^\\(index\\)(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$",
    "examples": ["(index)", "(index)-introduction", "(index)-chapter-one"],
    "with_number_examples": []
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Parser Round-Trip Consistency
*For any* valid ptree document, parsing then printing should produce text that re-parses to an equivalent AST.
**Validates: Requirements 7.1, 7.3**

### Property 2: NAME_TYPE Pattern-Example Consistency
*For any* NAME_TYPE definition, all provided examples should match the defined pattern regex.
**Validates: Requirements 1.2**

### Property 3: UniRule_1 Delimiter Conflict Detection
*For any* name with a version suffix, if the NAME_TYPE has a word_delimiter, the version delimiter must differ from the word delimiter.
**Validates: Requirements 6.1, 6.2, 6.4**

### Property 4: UniRule_5 Mixed Delimiter Detection
*For any* bare name (excluding version suffix), the name must not contain both `-` and `_` characters.
**Validates: Requirements 6.5**

### Property 5: Entity Classification Determinism
*For any* node name, the entity classification (ROOT/DIR/FILE/EXT/META) should be deterministic based on the name's suffix markers.
**Validates: Requirements 2.1, 3.1**

### Property 6: Roman Numeral Validation
*For any* string claimed to be a Roman numeral, it should match the standard Roman numeral format (I-M, values 1-1000).
**Validates: Requirements 4.5**

### Property 7: Extension Parsing Consistency
*For any* file name with extensions, splitting by firstDot or lastDot strategy should produce valid stem and extension parts that reconstruct to the original name.
**Validates: Requirements 2.1, 2.4**

### Property 8: Fixer Idempotence
*For any* ptree document, applying the fixer twice should produce the same result as applying it once.
**Validates: Requirements 8.3**

### Property 9: Sorting Transitivity (PT009)
*For any* three sibling nodes A, B, C where A < B and B < C according to PT009 rules, A < C must also hold.
**Validates: Requirements 8.1, 8.2**

### Property 10: Validator Determinism
*For any* ptree document and config, running validation multiple times should produce identical results.
**Validates: Requirements 1.5**

### Property 11: Config Merge Associativity
*For any* three configs A, B, C, merging (A merge B) merge C should equal A merge (B merge C).
**Validates: Requirements 1.4**

### Property 12: Index File Recognition
*For any* file name starting with `(index)`, the parser should correctly identify it as an index file and extract the remainder.
**Validates: Requirements 3.2, 3.5**

### Property 13: Symlink Parsing Consistency
*For any* node line containing ` -> ` arrow syntax, the parser should correctly split the name and target, and the name should be validated independently.
**Validates: Requirements 16.1, 16.2**

### Property 14: Inline Metadata Isolation
*For any* node with inline metadata (bracket attributes or comments), the metadata should not affect NAME_TYPE validation of the node name.
**Validates: Requirements 17.4**

### Property 15: Summary Line Recognition
*For any* line matching the pattern `N directories, M files`, the parser should recognize it as a summary line and not as a tree node.
**Validates: Requirements 18.1, 18.2**

## Error Handling

### Parser Error Recovery

The parser implements error recovery to continue parsing after encountering invalid lines:

1. **Invalid Line**: Log error, skip line, continue parsing
2. **Unclosed Bracket Block**: Log error with opening line, treat as single-line directive
3. **Depth Jump**: Log warning, accept the node but flag the structural issue
4. **Invalid Directive**: Log info, ignore directive, continue parsing

### Validator Error Reporting

All validation errors include:
- Rule code (PT000-PT015)
- Severity (error, warning, info)
- Human-readable message
- Line number (0-indexed)
- Column range (startCol, endCol)

### Config Error Handling

1. **Invalid JSON**: Report parse error with file path and position
2. **Schema Violation**: Report which field failed validation
3. **Unknown NAME_TYPE Reference**: Report the invalid reference and suggest alternatives
4. **Missing Required Field**: Report the field name and expected type

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific examples and property-based tests for universal properties.

**Property-Based Testing Library:** fast-check (npm package)

### Unit Tests

Unit tests cover:
- Specific NAME_TYPE examples from the registry
- Edge cases for Roman numeral parsing (I, IV, IX, XL, XC, CD, CM)
- Index file patterns with various separators
- Multi-extension files (.tar.gz, .config.json)
- Error recovery scenarios

### Property-Based Tests

Each correctness property is implemented as a property-based test:

```typescript
// Example: Property 1 - Parser Round-Trip
import * as fc from 'fast-check';

describe('Parser Round-Trip', () => {
  it('**Feature: ptree-completion, Property 1: Parser Round-Trip Consistency**', () => {
    fc.assert(
      fc.property(
        validPtreeDocumentArbitrary(),
        (doc) => {
          const text = printPtreeDocument(doc);
          const reparsed = parsePtreeDocument(text);
          return isEquivalentAST(doc, reparsed);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with feature name and property number
- Tests run in both default and spec profile modes

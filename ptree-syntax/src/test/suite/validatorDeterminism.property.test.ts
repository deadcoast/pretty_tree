import * as assert from 'assert';
import * as fc from 'fast-check';
import { parsePtreeDocument } from '../../core/parser';
import { validatePtreeDocument, LintMessage } from '../../core/validator';
import { PtreeConfig } from '../../core/config';

/**
 * **Feature: ptree-completion, Property 10: Validator Determinism**
 * **Validates: Requirements 1.5**
 * 
 * For any ptree document and config, running validation multiple times should
 * produce identical results.
 */

// Default config for testing
const DEFAULT_CONFIG: PtreeConfig = {
  ptree: '1.0',
  style: 'unicode',
  profile: 'default',
  NAME_TYPES: {
    'SCREAM_TYPE': {
      pattern: '^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$',
      word_delimiter: '_',
      allowed_version_delimiters: ['-'],
      examples: ['ROOT', 'MY_PROJECT', 'PTREE']
    },
    'High_Type': {
      pattern: '^[A-Z][a-z0-9]*(?:_[A-Z][a-z0-9]*)*$',
      word_delimiter: '_',
      allowed_version_delimiters: ['-'],
      examples: ['My_Dir', 'Some_Folder']
    },
    'smol-type': {
      pattern: '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
      word_delimiter: '-',
      allowed_version_delimiters: ['_'],
      examples: ['my-file', 'some-name']
    },
    'snake_type': {
      pattern: '^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$',
      word_delimiter: '_',
      allowed_version_delimiters: ['-'],
      examples: ['my_file', 'some_name']
    }
  },
  ENTITY_NAME_TYPES: {
    ROOT: ['SCREAM_TYPE'],
    DIR: ['High_Type', 'smol-type', 'snake_type'],
    FILE: ['smol-type', 'snake_type']
  }
};

// Spec config for testing
const SPEC_CONFIG: PtreeConfig = {
  ptree: 'spec',
  style: 'unicode',
  profile: 'spec',
  NAME_TYPES: DEFAULT_CONFIG.NAME_TYPES,
  ENTITY_NAME_TYPES: DEFAULT_CONFIG.ENTITY_NAME_TYPES
};

// Config with PT009 sorting enabled
const PT009_CONFIG: PtreeConfig = {
  ...DEFAULT_CONFIG,
  RULES: {
    PT009: true
  }
};

suite('Validator Determinism Property Tests', () => {

  // Helper to generate valid ptree scaffold characters
  const unicodeScaffold = {
    branch: '├──',
    lastBranch: '└──',
    vertical: '│',
    space: '    '
  };

  // Arbitrary for generating valid name segments
  const nameChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('');
  const nameArb = fc.array(fc.constantFrom(...nameChars), { minLength: 1, maxLength: 10 })
    .map(arr => arr.join(''));

  // Arbitrary for generating valid extension segments
  const extChars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const extArb = fc.array(fc.constantFrom(...extChars), { minLength: 1, maxLength: 4 })
    .map(arr => arr.join(''));

  // Arbitrary for generating a file name with optional extension
  const fileNameArb = fc.tuple(nameArb, fc.option(extArb, { nil: undefined }))
    .map(([name, ext]) => ext ? `${name}.${ext}` : name);

  // Arbitrary for generating a directory name (with trailing /)
  const dirNameArb = nameArb.map(name => `${name}/`);

  // Arbitrary for generating a root label
  const rootLabelArb = fc.constantFrom(
    'ROOT//',
    'PTREE-0.0.1//',
    'MY_PROJECT//',
    'Test_Root//'
  );

  // Generate a simple ptree document with root and flat nodes
  const simplePtreeArb = fc.tuple(
    rootLabelArb,
    fc.array(
      fc.oneof(fileNameArb, dirNameArb),
      { minLength: 0, maxLength: 5 }
    )
  ).map(([root, nodes]) => {
    const lines: string[] = [root];
    for (let i = 0; i < nodes.length; i++) {
      const isLast = i === nodes.length - 1;
      const scaffold = isLast ? unicodeScaffold.lastBranch : unicodeScaffold.branch;
      lines.push(`${scaffold} ${nodes[i]}`);
    }
    return lines.join('\n');
  });

  // Generate a ptree document with directives
  const directiveArb = fc.constantFrom(
    '@ptree: 1.0',
    '@ptree: default',
    '@ptree: spec',
    '@style: unicode',
    '@style: ascii',
    '@version: 1.0.0'
  );

  const ptreeWithDirectivesArb = fc.tuple(
    fc.array(directiveArb, { minLength: 0, maxLength: 3 }),
    simplePtreeArb
  ).map(([directives, tree]) => {
    const uniqueDirectives = [...new Set(directives)];
    return [...uniqueDirectives, tree].join('\n');
  });

  // Arbitrary for config selection
  const configArb = fc.constantFrom(DEFAULT_CONFIG, SPEC_CONFIG, PT009_CONFIG);

  /**
   * Helper to compare two arrays of LintMessages for equality.
   * Messages are considered equal if they have the same code, severity, message,
   * line, startCol, and endCol.
   */
  function messagesEqual(a: LintMessage[], b: LintMessage[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    for (let i = 0; i < a.length; i++) {
      const msgA = a[i];
      const msgB = b[i];
      
      if (msgA.code !== msgB.code ||
          msgA.severity !== msgB.severity ||
          msgA.message !== msgB.message ||
          msgA.line !== msgB.line ||
          msgA.startCol !== msgB.startCol ||
          msgA.endCol !== msgB.endCol) {
        return false;
      }
    }
    
    return true;
  }

  test('Property 10: Validator Determinism - same input produces same output', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        configArb,
        (ptreeText, config) => {
          const doc = parsePtreeDocument(ptreeText);
          
          // Run validation multiple times
          const result1 = validatePtreeDocument(doc, config);
          const result2 = validatePtreeDocument(doc, config);
          const result3 = validatePtreeDocument(doc, config);
          
          // All results should be identical
          return messagesEqual(result1, result2) && messagesEqual(result2, result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Validator Determinism - with directives', () => {
    fc.assert(
      fc.property(
        ptreeWithDirectivesArb,
        configArb,
        (ptreeText, config) => {
          const doc = parsePtreeDocument(ptreeText);
          
          // Run validation multiple times
          const result1 = validatePtreeDocument(doc, config);
          const result2 = validatePtreeDocument(doc, config);
          
          // Results should be identical
          return messagesEqual(result1, result2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Validator Determinism - message count is consistent', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        configArb,
        (ptreeText, config) => {
          const doc = parsePtreeDocument(ptreeText);
          
          // Run validation multiple times
          const result1 = validatePtreeDocument(doc, config);
          const result2 = validatePtreeDocument(doc, config);
          const result3 = validatePtreeDocument(doc, config);
          
          // Message counts should be identical
          return result1.length === result2.length && result2.length === result3.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Validator Determinism - message order is consistent', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        configArb,
        (ptreeText, config) => {
          const doc = parsePtreeDocument(ptreeText);
          
          // Run validation multiple times
          const result1 = validatePtreeDocument(doc, config);
          const result2 = validatePtreeDocument(doc, config);
          
          // Check that messages appear in the same order
          if (result1.length !== result2.length) {
            return false;
          }
          
          for (let i = 0; i < result1.length; i++) {
            if (result1[i].code !== result2[i].code ||
                result1[i].line !== result2[i].line) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Validator Determinism - specific examples', () => {
    const testCases = [
      // Simple valid document
      `ROOT//
├── src/
│   └── main.ts
└── readme.md`,
      
      // Document with validation errors
      `ROOT//
├── Invalid Name/
├── file.TXT
└── mixed-name_here.txt`,
      
      // Document with directives
      `@ptree: 1.0
@style: unicode
ROOT//
├── dir/
└── file.txt`,
      
      // Empty tree (just root)
      `ROOT//`,
      
      // Nested structure
      `ROOT//
├── src/
│   ├── core/
│   │   └── parser.ts
│   └── test/
│       └── test.ts
└── readme.md`,
      
      // Document with spec profile directives
      `@ptree: spec
@style: unicode
@version: 1.0.0
PTREE-1.0.0//
├── src/
└── readme.md`,
    ];

    for (const ptreeText of testCases) {
      const doc = parsePtreeDocument(ptreeText);
      
      // Test with each config
      for (const config of [DEFAULT_CONFIG, SPEC_CONFIG, PT009_CONFIG]) {
        const result1 = validatePtreeDocument(doc, config);
        const result2 = validatePtreeDocument(doc, config);
        const result3 = validatePtreeDocument(doc, config);
        
        assert.ok(
          messagesEqual(result1, result2),
          `Determinism failed for config ${config.profile} on:\n${ptreeText}\n\nFirst: ${JSON.stringify(result1)}\nSecond: ${JSON.stringify(result2)}`
        );
        
        assert.ok(
          messagesEqual(result2, result3),
          `Determinism failed for config ${config.profile} on:\n${ptreeText}\n\nSecond: ${JSON.stringify(result2)}\nThird: ${JSON.stringify(result3)}`
        );
      }
    }
  });

  test('Property 10: Validator Determinism - error codes are consistent', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        configArb,
        (ptreeText, config) => {
          const doc = parsePtreeDocument(ptreeText);
          
          // Run validation multiple times
          const result1 = validatePtreeDocument(doc, config);
          const result2 = validatePtreeDocument(doc, config);
          
          // Extract error codes
          const codes1 = result1.map(m => m.code).sort();
          const codes2 = result2.map(m => m.code).sort();
          
          // Error codes should be identical
          return JSON.stringify(codes1) === JSON.stringify(codes2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Validator Determinism - severities are consistent', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        configArb,
        (ptreeText, config) => {
          const doc = parsePtreeDocument(ptreeText);
          
          // Run validation multiple times
          const result1 = validatePtreeDocument(doc, config);
          const result2 = validatePtreeDocument(doc, config);
          
          // Extract severities
          const severities1 = result1.map(m => m.severity).sort();
          const severities2 = result2.map(m => m.severity).sort();
          
          // Severities should be identical
          return JSON.stringify(severities1) === JSON.stringify(severities2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

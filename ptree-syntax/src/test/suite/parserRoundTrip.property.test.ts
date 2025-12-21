import * as assert from 'assert';
import * as fc from 'fast-check';
import { parsePtreeDocument, printPtreeDocument, PtreeDocument } from '../../core/parser';

/**
 * **Feature: ptree-completion, Property 1: Parser Round-Trip Consistency**
 * **Validates: Requirements 7.1, 7.3**
 * 
 * For any valid ptree document, parsing then printing should produce text
 * that re-parses to an equivalent AST.
 */
suite('Parser Round-Trip Property Tests', () => {

  // Helper to generate valid ptree scaffold characters
  const unicodeScaffold = {
    branch: '├──',
    lastBranch: '└──',
    vertical: '│',
    space: '    '
  };

  // Arbitrary for generating valid name segments (no special chars that would break parsing)
  const nameChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('');
  const nameArb = fc.array(fc.constantFrom(...nameChars), { minLength: 1, maxLength: 15 })
    .map(arr => arr.join(''));

  // Arbitrary for generating valid extension segments
  const extChars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const extArb = fc.array(fc.constantFrom(...extChars), { minLength: 1, maxLength: 5 })
    .map(arr => arr.join(''));

  // Arbitrary for generating a file name with optional extension
  const fileNameArb = fc.tuple(nameArb, fc.option(extArb, { nil: undefined }))
    .map(([name, ext]) => ext ? `${name}.${ext}` : name);

  // Arbitrary for generating a directory name
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
    '@ptree: spec',
    '@ptree: default',
    '@style: unicode',
    '@style: ascii',
    '@version: 1.0.0',
    '@version: 0.0.1'
  );

  const ptreeWithDirectivesArb = fc.tuple(
    fc.array(directiveArb, { minLength: 0, maxLength: 3 }),
    simplePtreeArb
  ).map(([directives, tree]) => {
    const uniqueDirectives = [...new Set(directives)];
    return [...uniqueDirectives, tree].join('\n');
  });

  // Generate a ptree document with comments
  const commentArb = fc.constantFrom(
    '# This is a comment',
    '# Another comment',
    '  # Indented comment'
  );

  const ptreeWithCommentsArb = fc.tuple(
    fc.array(commentArb, { minLength: 0, maxLength: 2 }),
    simplePtreeArb
  ).map(([comments, tree]) => {
    return [...comments, tree].join('\n');
  });

  /**
   * Helper to compare two PtreeDocuments for equivalence.
   * We compare the structural content, not the exact raw strings.
   */
  function areDocumentsEquivalent(doc1: PtreeDocument, doc2: PtreeDocument): boolean {
    // Compare directives
    if (Object.keys(doc1.directives).length !== Object.keys(doc2.directives).length) {
      return false;
    }
    for (const key of Object.keys(doc1.directives)) {
      if (doc1.directives[key] !== doc2.directives[key]) {
        return false;
      }
    }

    // Compare root
    if ((doc1.root === undefined) !== (doc2.root === undefined)) {
      return false;
    }
    if (doc1.root && doc2.root) {
      if (doc1.root.value !== doc2.root.value || doc1.root.kind !== doc2.root.kind) {
        return false;
      }
    }

    // Compare nodes
    if (doc1.nodes.length !== doc2.nodes.length) {
      return false;
    }
    for (let i = 0; i < doc1.nodes.length; i++) {
      const n1 = doc1.nodes[i];
      const n2 = doc2.nodes[i];
      if (n1.name !== n2.name || n1.depth !== n2.depth || n1.hasChildren !== n2.hasChildren) {
        return false;
      }
    }

    // Compare comment lines count
    if (doc1.commentLines.length !== doc2.commentLines.length) {
      return false;
    }

    // Compare blank lines count
    if (doc1.blankLines.length !== doc2.blankLines.length) {
      return false;
    }

    return true;
  }

  test('Property 1: Parser Round-Trip Consistency - simple documents', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        (ptreeText) => {
          const doc1 = parsePtreeDocument(ptreeText);
          const printed = printPtreeDocument(doc1);
          const doc2 = parsePtreeDocument(printed);
          
          return areDocumentsEquivalent(doc1, doc2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Parser Round-Trip Consistency - documents with directives', () => {
    fc.assert(
      fc.property(
        ptreeWithDirectivesArb,
        (ptreeText) => {
          const doc1 = parsePtreeDocument(ptreeText);
          const printed = printPtreeDocument(doc1);
          const doc2 = parsePtreeDocument(printed);
          
          return areDocumentsEquivalent(doc1, doc2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Parser Round-Trip Consistency - documents with comments', () => {
    fc.assert(
      fc.property(
        ptreeWithCommentsArb,
        (ptreeText) => {
          const doc1 = parsePtreeDocument(ptreeText);
          const printed = printPtreeDocument(doc1);
          const doc2 = parsePtreeDocument(printed);
          
          return areDocumentsEquivalent(doc1, doc2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Parser Round-Trip Consistency - text identity for valid documents', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        (ptreeText) => {
          const doc = parsePtreeDocument(ptreeText);
          const printed = printPtreeDocument(doc);
          
          // The printed text should be identical to the original
          return printed === ptreeText;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Parser Round-Trip Consistency - specific examples', () => {
    const testCases = [
      // Simple document
      `ROOT//
├── file.txt
└── dir/`,
      
      // Document with directives
      `@ptree: spec
@style: unicode
ROOT//
├── src/
│   └── index.ts
└── readme.md`,
      
      // Document with comments
      `# Header comment
ROOT//
├── file.txt
└── dir/`,
      
      // Document with blank lines
      `@ptree: default

ROOT//
├── file.txt

└── dir/`,
      
      // ASCII style
      `ROOT//
|-- file.txt
\`-- dir/`,
      
      // Nested structure
      `ROOT//
├── src/
│   ├── core/
│   │   └── parser.ts
│   └── test/
│       └── parser.test.ts
└── readme.md`,
    ];

    for (const ptreeText of testCases) {
      const doc1 = parsePtreeDocument(ptreeText);
      const printed = printPtreeDocument(doc1);
      const doc2 = parsePtreeDocument(printed);
      
      assert.ok(
        areDocumentsEquivalent(doc1, doc2),
        `Round-trip failed for:\n${ptreeText}\n\nPrinted:\n${printed}`
      );
    }
  });

  test('Property 1: Parser Round-Trip Consistency - preserves directive position fields', () => {
    const ptreeText = `@ptree: spec
@style: unicode
ROOT//
└── file.txt`;

    const doc = parsePtreeDocument(ptreeText);
    
    // Check that position fields are populated
    for (const directive of doc.directiveLines) {
      assert.ok(directive.keyStartCol >= 0, 'keyStartCol should be set');
      assert.ok(directive.keyEndCol > directive.keyStartCol, 'keyEndCol should be after keyStartCol');
      assert.ok(directive.valueStartCol >= 0, 'valueStartCol should be set');
      assert.ok(directive.valueEndCol >= directive.valueStartCol, 'valueEndCol should be >= valueStartCol');
      assert.ok(
        directive.separatorChar === ':' || directive.separatorChar === '=' || directive.separatorChar === null,
        'separatorChar should be :, =, or null'
      );
    }
  });

  test('Property 1: Parser Round-Trip Consistency - multi-line directive blocks', () => {
    const ptreeText = `@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type'
]
ROOT//
└── file.txt`;

    const doc1 = parsePtreeDocument(ptreeText);
    const printed = printPtreeDocument(doc1);
    const doc2 = parsePtreeDocument(printed);
    
    assert.ok(
      areDocumentsEquivalent(doc1, doc2),
      `Round-trip failed for multi-line directive block`
    );
    
    // Verify the directive was parsed correctly
    assert.ok(doc1.directives['name_type'], 'name_type directive should be parsed');
    assert.ok(doc1.directives['name_type'].includes('SCREAM_TYPE'), 'Should contain SCREAM_TYPE');
  });

  test('Property 1: Parser Round-Trip Consistency - empty document', () => {
    const ptreeText = '';
    const doc1 = parsePtreeDocument(ptreeText);
    const printed = printPtreeDocument(doc1);
    const doc2 = parsePtreeDocument(printed);
    
    assert.ok(areDocumentsEquivalent(doc1, doc2), 'Empty document round-trip should work');
  });

  test('Property 1: Parser Round-Trip Consistency - only comments', () => {
    const ptreeText = `# Comment 1
# Comment 2`;
    const doc1 = parsePtreeDocument(ptreeText);
    const printed = printPtreeDocument(doc1);
    const doc2 = parsePtreeDocument(printed);
    
    assert.ok(areDocumentsEquivalent(doc1, doc2), 'Comment-only document round-trip should work');
    assert.strictEqual(doc1.commentLines.length, 2, 'Should have 2 comment lines');
  });
});

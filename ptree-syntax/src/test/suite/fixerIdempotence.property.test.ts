import * as assert from 'assert';
import * as fc from 'fast-check';
import { parsePtreeDocument } from '../../core/parser';
import { applyCanonicalFixes } from '../../core/fixer';
import { PtreeConfig } from '../../core/config';

/**
 * **Feature: ptree-completion, Property 8: Fixer Idempotence**
 * **Validates: Requirements 8.3**
 * 
 * For any ptree document, applying the fixer twice should produce the same result
 * as applying it once.
 */

const DEFAULT_CONFIG: PtreeConfig = {
  ptree: '1.0',
  style: 'unicode',
  profile: 'default',
  NAME_TYPES: {}
};

const PT009_ENABLED_CONFIG: PtreeConfig = {
  ptree: '1.0',
  style: 'unicode',
  profile: 'default',
  NAME_TYPES: {},
  RULES: {
    PT009: true
  }
};

suite('Fixer Idempotence Property Tests', () => {

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

  // Arbitrary for generating valid extension segments (may include uppercase for testing)
  const extChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
  const extArb = fc.array(fc.constantFrom(...extChars), { minLength: 1, maxLength: 4 })
    .map(arr => arr.join(''));

  // Arbitrary for generating a file name with optional extension
  const fileNameArb = fc.tuple(nameArb, fc.option(extArb, { nil: undefined }))
    .map(([name, ext]) => ext ? `${name}.${ext}` : name);

  // Arbitrary for generating a directory name (may or may not have trailing /)
  const dirNameArb = fc.tuple(nameArb, fc.boolean())
    .map(([name, hasSlash]) => hasSlash ? `${name}/` : name);

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
    '@style: unicode',
    '@style: ascii'
  );

  const ptreeWithDirectivesArb = fc.tuple(
    fc.array(directiveArb, { minLength: 0, maxLength: 2 }),
    simplePtreeArb
  ).map(([directives, tree]) => {
    const uniqueDirectives = [...new Set(directives)];
    return [...uniqueDirectives, tree].join('\n');
  });

  // Arbitrary for config selection
  const configArb = fc.constantFrom(DEFAULT_CONFIG, PT009_ENABLED_CONFIG);

  test('Property 8: Fixer Idempotence - applying fixer twice equals applying once', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        configArb,
        (ptreeText, config) => {
          // First application
          const doc1 = parsePtreeDocument(ptreeText);
          const result1 = applyCanonicalFixes(ptreeText, doc1, config);
          
          // Second application
          const doc2 = parsePtreeDocument(result1.fixedText);
          const result2 = applyCanonicalFixes(result1.fixedText, doc2, config);
          
          // The result of applying twice should equal applying once
          return result1.fixedText === result2.fixedText;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Fixer Idempotence - with directives', () => {
    fc.assert(
      fc.property(
        ptreeWithDirectivesArb,
        configArb,
        (ptreeText, config) => {
          // First application
          const doc1 = parsePtreeDocument(ptreeText);
          const result1 = applyCanonicalFixes(ptreeText, doc1, config);
          
          // Second application
          const doc2 = parsePtreeDocument(result1.fixedText);
          const result2 = applyCanonicalFixes(result1.fixedText, doc2, config);
          
          // The result of applying twice should equal applying once
          return result1.fixedText === result2.fixedText;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Fixer Idempotence - second application reports no changes', () => {
    fc.assert(
      fc.property(
        simplePtreeArb,
        configArb,
        (ptreeText, config) => {
          // First application
          const doc1 = parsePtreeDocument(ptreeText);
          const result1 = applyCanonicalFixes(ptreeText, doc1, config);
          
          // Second application
          const doc2 = parsePtreeDocument(result1.fixedText);
          const result2 = applyCanonicalFixes(result1.fixedText, doc2, config);
          
          // Second application should report no changes (empty applied array)
          return result2.applied.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Fixer Idempotence - PT009 sorting is idempotent', () => {
    // Generate documents that specifically test PT009 sorting
    const unsortedPtreeArb = fc.tuple(
      fc.array(fileNameArb, { minLength: 2, maxLength: 4 }),
      fc.array(dirNameArb.map(d => d.endsWith('/') ? d : `${d}/`), { minLength: 2, maxLength: 4 })
    ).map(([files, dirs]) => {
      // Interleave files and directories to create unsorted input
      const nodes = [...files, ...dirs];
      // Shuffle the nodes
      for (let i = nodes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
      }
      
      const lines: string[] = ['ROOT//'];
      for (let i = 0; i < nodes.length; i++) {
        const isLast = i === nodes.length - 1;
        const scaffold = isLast ? unicodeScaffold.lastBranch : unicodeScaffold.branch;
        lines.push(`${scaffold} ${nodes[i]}`);
      }
      return lines.join('\n');
    });

    fc.assert(
      fc.property(
        unsortedPtreeArb,
        (ptreeText) => {
          // First application with PT009 enabled
          const doc1 = parsePtreeDocument(ptreeText);
          const result1 = applyCanonicalFixes(ptreeText, doc1, PT009_ENABLED_CONFIG);
          
          // Second application
          const doc2 = parsePtreeDocument(result1.fixedText);
          const result2 = applyCanonicalFixes(result1.fixedText, doc2, PT009_ENABLED_CONFIG);
          
          // The result of applying twice should equal applying once
          return result1.fixedText === result2.fixedText;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Fixer Idempotence - specific examples', () => {
    const testCases = [
      // Simple unsorted document
      `ROOT//
├── zebra.txt
├── alpha/
└── beta.txt`,
      
      // Document with uppercase extension
      `ROOT//
├── file.TXT
└── dir/`,
      
      // Document with missing directory slash
      `ROOT//
├── folder
│   └── file.txt
└── readme.md`,
      
      // Already sorted document
      `ROOT//
├── alpha/
├── beta/
├── a.txt
└── z.txt`,
      
      // Nested structure
      `ROOT//
├── src/
│   ├── z-file.ts
│   └── a-file.ts
└── readme.md`,
    ];

    for (const ptreeText of testCases) {
      // First application
      const doc1 = parsePtreeDocument(ptreeText);
      const result1 = applyCanonicalFixes(ptreeText, doc1, PT009_ENABLED_CONFIG);
      
      // Second application
      const doc2 = parsePtreeDocument(result1.fixedText);
      const result2 = applyCanonicalFixes(result1.fixedText, doc2, PT009_ENABLED_CONFIG);
      
      assert.strictEqual(
        result1.fixedText,
        result2.fixedText,
        `Idempotence failed for:\n${ptreeText}\n\nFirst fix:\n${result1.fixedText}\n\nSecond fix:\n${result2.fixedText}`
      );
      
      assert.strictEqual(
        result2.applied.length,
        0,
        `Second application should report no changes for:\n${ptreeText}`
      );
    }
  });
});

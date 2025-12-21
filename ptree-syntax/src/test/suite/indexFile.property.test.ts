import * as assert from 'assert';
import * as fc from 'fast-check';
import { parseIndexFile, parsePtreeDocument } from '../../core/parser';

/**
 * **Feature: ptree-completion, Property 12: Index File Recognition**
 * **Validates: Requirements 3.2, 3.5**
 * 
 * For any file name starting with `(index)`, the parser should correctly identify it as an index file and extract the remainder.
 */
suite('Index File Property Tests', () => {

  // Helper to generate valid file name suffixes (lowercase letters, numbers, hyphens)
  function validFileNameSuffix(): fc.Arbitrary<string> {
    return fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
      { minLength: 1, maxLength: 20 }
    ).map(arr => arr.join(''));
  }

  // Helper to generate valid file extensions
  function validExtension(): fc.Arbitrary<string> {
    return fc.constantFrom('md', 'txt', 'ts', 'js', 'json', 'html', 'css', 'py', 'rb');
  }

  test('Property 12: Index File Recognition - parseIndexFile correctly identifies index files', () => {
    fc.assert(
      fc.property(
        // Generate index file names with various patterns
        fc.oneof(
          // Just (index) with extension
          validExtension().map(ext => `(index).${ext}`),
          // (index) with hyphen separator and suffix
          fc.tuple(validFileNameSuffix(), validExtension())
            .map(([suffix, ext]) => `(index)-${suffix}.${ext}`),
          // (index) with underscore separator and suffix
          fc.tuple(validFileNameSuffix(), validExtension())
            .map(([suffix, ext]) => `(index)_${suffix}.${ext}`)
        ),
        (indexFileName) => {
          const result = parseIndexFile(indexFileName);
          return result.isIndex === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12: Index File Recognition - parseIndexFile extracts correct remainder', () => {
    fc.assert(
      fc.property(
        validFileNameSuffix(),
        validExtension(),
        fc.constantFrom('-', '_'),
        (suffix, ext, separator) => {
          const indexFileName = `(index)${separator}${suffix}.${ext}`;
          const result = parseIndexFile(indexFileName);
          
          // The remainder should be the suffix with extension
          return result.isIndex === true && result.remainder === `${suffix}.${ext}`;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12: Index File Recognition - non-index files are not marked as index', () => {
    fc.assert(
      fc.property(
        // Generate file names that don't start with (index)
        fc.oneof(
          validFileNameSuffix().map(name => `${name}.md`),
          fc.constant('readme.md'),
          fc.constant('index.ts'),  // Note: "index" without parentheses is NOT an index file
          fc.constant('INDEX.md'),
          fc.constant('(INDEX).md'),  // Wrong case
          fc.constant('(other).md')   // Different prefix
        ),
        (nonIndexFileName) => {
          const result = parseIndexFile(nonIndexFileName);
          return result.isIndex === false && result.remainder === nonIndexFileName;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12: Index File Recognition - parser marks index files in document', () => {
    fc.assert(
      fc.property(
        validFileNameSuffix(),
        validExtension(),
        (suffix, ext) => {
          const indexFileName = `(index)-${suffix}.${ext}`;
          const text = `ROOT//\n└── ${indexFileName}`;
          const doc = parsePtreeDocument(text);
          
          const node = doc.nodes.find(n => n.name === indexFileName);
          return node !== undefined && node.isIndexFile === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12: Index File Recognition - directories are not marked as index files', () => {
    fc.assert(
      fc.property(
        validFileNameSuffix(),
        (suffix) => {
          // Create a directory with (index) prefix
          const dirName = `(index)-${suffix}/`;
          const text = `ROOT//\n└── ${dirName}`;
          const doc = parsePtreeDocument(text);
          
          const node = doc.nodes.find(n => n.name === dirName);
          // Directories should NOT be marked as index files
          return node !== undefined && node.isIndexFile === undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12: Index File Recognition - specific valid examples', () => {
    const validIndexFiles = [
      '(index).md',
      '(index).txt',
      '(index)-introduction.md',
      '(index)-chapter-one.md',
      '(index)_main.ts',
      '(index)_config.json'
    ];
    
    for (const fileName of validIndexFiles) {
      const result = parseIndexFile(fileName);
      assert.ok(result.isIndex, `Expected "${fileName}" to be recognized as index file`);
    }
  });

  test('Property 12: Index File Recognition - specific invalid examples', () => {
    const invalidIndexFiles = [
      'index.md',           // No parentheses
      'INDEX.md',           // No parentheses, uppercase
      '(INDEX).md',         // Wrong case
      '(other).md',         // Different prefix
      'readme.md',          // Regular file
      '(index)/',           // Directory, not file
      '(index)-dir/'        // Directory, not file
    ];
    
    for (const fileName of invalidIndexFiles) {
      // For directories, we test parseIndexFile which doesn't know about directories
      // The parser handles directory exclusion separately
      if (!fileName.endsWith('/')) {
        const result = parseIndexFile(fileName);
        assert.ok(!result.isIndex, `Expected "${fileName}" to NOT be recognized as index file`);
      }
    }
  });
});

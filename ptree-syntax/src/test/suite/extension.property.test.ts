import * as assert from 'assert';
import * as fc from 'fast-check';
import { splitFileExtension } from '../../core/parser';

/**
 * **Feature: ptree-completion, Property 7: Extension Parsing Consistency**
 * **Validates: Requirements 2.1, 2.4**
 * 
 * For any file name with extensions, splitting by firstDot or lastDot strategy
 * should produce valid stem and extension parts that reconstruct to the original name.
 */
suite('Extension Parsing Property Tests', () => {

  // Helper to generate a string from a set of characters
  function stringFromChars(chars: string[], minLength: number, maxLength: number): fc.Arbitrary<string> {
    return fc.array(fc.constantFrom(...chars), { minLength, maxLength })
      .map(arr => arr.join(''));
  }

  // Arbitrary for generating valid file name segments (no dots)
  const segmentChars = 'abcdefghijklmnopqrstuvwxyz0123456789-_'.split('');
  const segmentArb = stringFromChars(segmentChars, 1, 10);

  // Arbitrary for generating extension segments (lowercase, no dots)
  const extChars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const extSegmentArb = stringFromChars(extChars, 1, 5);

  test('Property 7: Extension Parsing Consistency - round trip with lastDot strategy', () => {
    fc.assert(
      fc.property(
        segmentArb,
        fc.array(extSegmentArb, { minLength: 1, maxLength: 3 }),
        (stem, extensions) => {
          const fileName = `${stem}.${extensions.join('.')}`;
          const result = splitFileExtension(fileName, 'lastDot');
          
          // Reconstruct the file name from stem and extensions
          const reconstructed = result.extensions.length > 0
            ? `${result.stem}.${result.extensions.join('.')}`
            : result.stem;
          
          return reconstructed === fileName;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Extension Parsing Consistency - round trip with firstDot strategy', () => {
    fc.assert(
      fc.property(
        segmentArb,
        fc.array(extSegmentArb, { minLength: 1, maxLength: 3 }),
        (stem, extensions) => {
          const fileName = `${stem}.${extensions.join('.')}`;
          const result = splitFileExtension(fileName, 'firstDot');
          
          // Reconstruct the file name from stem and extensions
          const reconstructed = result.extensions.length > 0
            ? `${result.stem}.${result.extensions.join('.')}`
            : result.stem;
          
          return reconstructed === fileName;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Extension Parsing Consistency - dotfiles have no extension', () => {
    fc.assert(
      fc.property(
        segmentArb,
        (name) => {
          const dotfile = `.${name}`;
          const resultLast = splitFileExtension(dotfile, 'lastDot');
          const resultFirst = splitFileExtension(dotfile, 'firstDot');
          
          // Dotfiles should have no extension
          return resultLast.stem === dotfile && 
                 resultLast.extensions.length === 0 &&
                 resultFirst.stem === dotfile && 
                 resultFirst.extensions.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Extension Parsing Consistency - files without dots have no extension', () => {
    fc.assert(
      fc.property(
        segmentArb,
        (name) => {
          const resultLast = splitFileExtension(name, 'lastDot');
          const resultFirst = splitFileExtension(name, 'firstDot');
          
          // Files without dots should have no extension
          return resultLast.stem === name && 
                 resultLast.extensions.length === 0 &&
                 resultFirst.stem === name && 
                 resultFirst.extensions.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Extension Parsing Consistency - lastDot produces single extension', () => {
    fc.assert(
      fc.property(
        segmentArb,
        fc.array(extSegmentArb, { minLength: 2, maxLength: 3 }),
        (stem, extensions) => {
          const fileName = `${stem}.${extensions.join('.')}`;
          const result = splitFileExtension(fileName, 'lastDot');
          
          // lastDot should produce exactly one extension segment
          return result.extensions.length === 1 &&
                 result.extensions[0] === extensions[extensions.length - 1];
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Extension Parsing Consistency - firstDot produces all extension segments', () => {
    fc.assert(
      fc.property(
        segmentArb,
        fc.array(extSegmentArb, { minLength: 1, maxLength: 3 }),
        (stem, extensions) => {
          const fileName = `${stem}.${extensions.join('.')}`;
          const result = splitFileExtension(fileName, 'firstDot');
          
          // firstDot should produce all extension segments
          return result.extensions.length === extensions.length &&
                 result.extensions.every((ext, i) => ext === extensions[i]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: Extension Parsing Consistency - specific examples', () => {
    // Test specific examples from the design document
    const testCases: Array<{
      fileName: string;
      strategy: 'firstDot' | 'lastDot';
      expectedStem: string;
      expectedExtensions: string[];
    }> = [
      { fileName: 'parser.ts', strategy: 'lastDot', expectedStem: 'parser', expectedExtensions: ['ts'] },
      { fileName: 'parser.test.ts', strategy: 'firstDot', expectedStem: 'parser', expectedExtensions: ['test', 'ts'] },
      { fileName: 'parser.test.ts', strategy: 'lastDot', expectedStem: 'parser.test', expectedExtensions: ['ts'] },
      { fileName: '.gitignore', strategy: 'lastDot', expectedStem: '.gitignore', expectedExtensions: [] },
      { fileName: '.gitignore', strategy: 'firstDot', expectedStem: '.gitignore', expectedExtensions: [] },
      { fileName: 'archive.tar.gz', strategy: 'firstDot', expectedStem: 'archive', expectedExtensions: ['tar', 'gz'] },
      { fileName: 'archive.tar.gz', strategy: 'lastDot', expectedStem: 'archive.tar', expectedExtensions: ['gz'] },
      { fileName: 'readme', strategy: 'lastDot', expectedStem: 'readme', expectedExtensions: [] },
      { fileName: 'readme', strategy: 'firstDot', expectedStem: 'readme', expectedExtensions: [] },
      { fileName: '.env', strategy: 'lastDot', expectedStem: '.env', expectedExtensions: [] },
      { fileName: '.editorconfig', strategy: 'firstDot', expectedStem: '.editorconfig', expectedExtensions: [] },
    ];

    for (const { fileName, strategy, expectedStem, expectedExtensions } of testCases) {
      const result = splitFileExtension(fileName, strategy);
      assert.strictEqual(
        result.stem,
        expectedStem,
        `[${strategy}] "${fileName}" stem should be "${expectedStem}", got "${result.stem}"`
      );
      assert.deepStrictEqual(
        result.extensions,
        expectedExtensions,
        `[${strategy}] "${fileName}" extensions should be [${expectedExtensions.join(', ')}], got [${result.extensions.join(', ')}]`
      );
    }
  });
});

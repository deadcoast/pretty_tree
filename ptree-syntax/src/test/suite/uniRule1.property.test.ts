import * as assert from 'assert';
import * as fc from 'fast-check';
import { validateUniRule1 } from '../../core/validator';
import { NameTypeDef } from '../../core/config';

/**
 * **Feature: ptree-completion, Property 3: UniRule_1 Delimiter Conflict Detection**
 * **Validates: Requirements 6.1, 6.2, 6.4**
 * 
 * For any name with a version suffix, if the NAME_TYPE has a word_delimiter,
 * the version delimiter must differ from the word delimiter.
 */
suite('UniRule_1 Property Tests', () => {

  // Arbitrary for generating valid delimiters
  const delimiterArb = fc.constantFrom('-', '_', '.');

  // Arbitrary for generating NAME_TYPE definitions
  const nameTypeDefArb = fc.record({
    word_delimiter: fc.oneof(fc.constant(null), delimiterArb),
    allowed_version_delimiters: fc.array(delimiterArb, { minLength: 1, maxLength: 3 })
      .map(arr => [...new Set(arr)]) // Remove duplicates
  }).map(({ word_delimiter, allowed_version_delimiters }) => ({
    description: 'Test NAME_TYPE',
    word_delimiter,
    allowed_version_delimiters,
    pattern: '^[a-z]+$'
  } as NameTypeDef));

  test('Property 3: UniRule_1 - null version delimiter always passes', () => {
    fc.assert(
      fc.property(
        nameTypeDefArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        (nameTypeDef, nameTypeId) => {
          const result = validateUniRule1(null, nameTypeDef, nameTypeId);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: UniRule_1 - version delimiter matching word delimiter fails', () => {
    fc.assert(
      fc.property(
        delimiterArb,
        fc.array(delimiterArb, { minLength: 1, maxLength: 3 }).map(arr => [...new Set(arr)]),
        fc.string({ minLength: 1, maxLength: 10 }),
        (delimiter, allowedDelimiters, nameTypeId) => {
          // Create a NAME_TYPE where word_delimiter equals the version delimiter
          const nameTypeDef: NameTypeDef = {
            description: 'Test NAME_TYPE',
            word_delimiter: delimiter,
            allowed_version_delimiters: allowedDelimiters,
            pattern: '^[a-z]+$'
          };

          const result = validateUniRule1(delimiter, nameTypeDef, nameTypeId);
          
          // Should fail because version delimiter matches word delimiter
          return result !== null && result.includes('UniRule_1');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: UniRule_1 - version delimiter not in allowed list fails', () => {
    fc.assert(
      fc.property(
        delimiterArb,
        delimiterArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        (versionDelimiter, wordDelimiter, nameTypeId) => {
          // Create a NAME_TYPE where version delimiter is NOT in allowed list
          // and word delimiter is different from version delimiter
          const allowedDelimiters = ['-', '_', '.'].filter(d => d !== versionDelimiter);
          
          // Skip if no delimiters left (shouldn't happen with 3 options)
          if (allowedDelimiters.length === 0) return true;
          
          const nameTypeDef: NameTypeDef = {
            description: 'Test NAME_TYPE',
            word_delimiter: wordDelimiter === versionDelimiter ? null : wordDelimiter,
            allowed_version_delimiters: allowedDelimiters,
            pattern: '^[a-z]+$'
          };

          const result = validateUniRule1(versionDelimiter, nameTypeDef, nameTypeId);
          
          // Should fail because version delimiter is not in allowed list
          return result !== null && result.includes('not allowed');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: UniRule_1 - valid version delimiter passes', () => {
    fc.assert(
      fc.property(
        delimiterArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        (versionDelimiter, nameTypeId) => {
          // Create a NAME_TYPE where:
          // 1. word_delimiter is different from version delimiter (or null)
          // 2. version delimiter is in allowed list
          const wordDelimiter = versionDelimiter === '-' ? '_' : '-';
          
          const nameTypeDef: NameTypeDef = {
            description: 'Test NAME_TYPE',
            word_delimiter: wordDelimiter,
            allowed_version_delimiters: [versionDelimiter],
            pattern: '^[a-z]+$'
          };

          const result = validateUniRule1(versionDelimiter, nameTypeDef, nameTypeId);
          
          // Should pass
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: UniRule_1 - null word delimiter allows any version delimiter in allowed list', () => {
    fc.assert(
      fc.property(
        delimiterArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        (versionDelimiter, nameTypeId) => {
          // Create a NAME_TYPE with null word_delimiter
          const nameTypeDef: NameTypeDef = {
            description: 'Test NAME_TYPE',
            word_delimiter: null,
            allowed_version_delimiters: [versionDelimiter],
            pattern: '^[a-z]+$'
          };

          const result = validateUniRule1(versionDelimiter, nameTypeDef, nameTypeId);
          
          // Should pass because word_delimiter is null
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: UniRule_1 - specific examples from config', () => {
    // Test with actual NAME_TYPE definitions from the config
    const testCases: Array<{
      nameTypeId: string;
      nameTypeDef: NameTypeDef;
      versionDelimiter: string;
      shouldPass: boolean;
      description: string;
    }> = [
      {
        nameTypeId: 'SCREAM_TYPE',
        nameTypeDef: {
          description: 'SCREAMING_SNAKE_CASE',
          word_delimiter: '_',
          allowed_version_delimiters: ['-'],
          pattern: '^[A-Z0-9]+(?:_[A-Z0-9]+)*$'
        },
        versionDelimiter: '-',
        shouldPass: true,
        description: 'SCREAM_TYPE with - version delimiter should pass'
      },
      {
        nameTypeId: 'SCREAM_TYPE',
        nameTypeDef: {
          description: 'SCREAMING_SNAKE_CASE',
          word_delimiter: '_',
          allowed_version_delimiters: ['-'],
          pattern: '^[A-Z0-9]+(?:_[A-Z0-9]+)*$'
        },
        versionDelimiter: '_',
        shouldPass: false,
        description: 'SCREAM_TYPE with _ version delimiter should fail (matches word delimiter)'
      },
      {
        nameTypeId: 'smol-type',
        nameTypeDef: {
          description: 'kebab-case',
          word_delimiter: '-',
          allowed_version_delimiters: ['_'],
          pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        },
        versionDelimiter: '_',
        shouldPass: true,
        description: 'smol-type with _ version delimiter should pass'
      },
      {
        nameTypeId: 'smol-type',
        nameTypeDef: {
          description: 'kebab-case',
          word_delimiter: '-',
          allowed_version_delimiters: ['_'],
          pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        },
        versionDelimiter: '-',
        shouldPass: false,
        description: 'smol-type with - version delimiter should fail (matches word delimiter)'
      },
      {
        nameTypeId: 'CamelType',
        nameTypeDef: {
          description: 'PascalCase',
          word_delimiter: null,
          allowed_version_delimiters: ['-', '_'],
          pattern: '^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$'
        },
        versionDelimiter: '-',
        shouldPass: true,
        description: 'CamelType with - version delimiter should pass (no word delimiter)'
      },
      {
        nameTypeId: 'CamelType',
        nameTypeDef: {
          description: 'PascalCase',
          word_delimiter: null,
          allowed_version_delimiters: ['-', '_'],
          pattern: '^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$'
        },
        versionDelimiter: '_',
        shouldPass: true,
        description: 'CamelType with _ version delimiter should pass (no word delimiter)'
      },
      {
        nameTypeId: 'CamelType',
        nameTypeDef: {
          description: 'PascalCase',
          word_delimiter: null,
          allowed_version_delimiters: ['-', '_'],
          pattern: '^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$'
        },
        versionDelimiter: '.',
        shouldPass: false,
        description: 'CamelType with . version delimiter should fail (not in allowed list)'
      }
    ];

    for (const { nameTypeId, nameTypeDef, versionDelimiter, shouldPass, description } of testCases) {
      const result = validateUniRule1(versionDelimiter, nameTypeDef, nameTypeId);
      
      if (shouldPass) {
        assert.strictEqual(result, null, `${description}: expected null, got "${result}"`);
      } else {
        assert.notStrictEqual(result, null, `${description}: expected error message, got null`);
      }
    }
  });
});

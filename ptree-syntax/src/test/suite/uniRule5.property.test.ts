import * as assert from 'assert';
import * as fc from 'fast-check';
import { validateUniRule5 } from '../../core/validator';

/**
 * **Feature: ptree-completion, Property 4: UniRule_5 Mixed Delimiter Detection**
 * **Validates: Requirements 6.5**
 * 
 * For any bare name (excluding version suffix), the name must not contain
 * both '-' and '_' characters.
 */
suite('UniRule_5 Property Tests', () => {

  // Arbitrary for generating name segments without delimiters
  const alphanumChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
  const segmentArb = fc.array(fc.constantFrom(...alphanumChars), { minLength: 1, maxLength: 8 })
    .map(arr => arr.join(''));

  test('Property 4: UniRule_5 - names with only hyphens pass', () => {
    fc.assert(
      fc.property(
        fc.array(segmentArb, { minLength: 1, maxLength: 4 }),
        (segments) => {
          const name = segments.join('-');
          const result = validateUniRule5(name);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: UniRule_5 - names with only underscores pass', () => {
    fc.assert(
      fc.property(
        fc.array(segmentArb, { minLength: 1, maxLength: 4 }),
        (segments) => {
          const name = segments.join('_');
          const result = validateUniRule5(name);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: UniRule_5 - names with no delimiters pass', () => {
    fc.assert(
      fc.property(
        segmentArb,
        (name) => {
          const result = validateUniRule5(name);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: UniRule_5 - names with both hyphens and underscores fail', () => {
    fc.assert(
      fc.property(
        fc.array(segmentArb, { minLength: 2, maxLength: 4 }),
        fc.array(segmentArb, { minLength: 1, maxLength: 3 }),
        (hyphenParts, underscoreParts) => {
          // Create a name that has both - and _
          const hyphenPart = hyphenParts.join('-');
          const underscorePart = underscoreParts.join('_');
          const name = `${hyphenPart}_${underscorePart}`;
          
          const result = validateUniRule5(name);
          return result !== null && result.includes('UniRule_5');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: UniRule_5 - mixed delimiters in any order fail', () => {
    fc.assert(
      fc.property(
        segmentArb,
        segmentArb,
        segmentArb,
        fc.boolean(),
        (seg1, seg2, seg3, hyphenFirst) => {
          // Create a name with mixed delimiters
          const name = hyphenFirst
            ? `${seg1}-${seg2}_${seg3}`
            : `${seg1}_${seg2}-${seg3}`;
          
          const result = validateUniRule5(name);
          return result !== null && result.includes('UniRule_5');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: UniRule_5 - single hyphen or underscore passes', () => {
    fc.assert(
      fc.property(
        segmentArb,
        segmentArb,
        fc.constantFrom('-', '_'),
        (seg1, seg2, delimiter) => {
          const name = `${seg1}${delimiter}${seg2}`;
          const result = validateUniRule5(name);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: UniRule_5 - specific examples', () => {
    const testCases: Array<{
      name: string;
      shouldPass: boolean;
      description: string;
    }> = [
      // Valid names (only one type of delimiter or none)
      { name: 'my-file-name', shouldPass: true, description: 'kebab-case should pass' },
      { name: 'my_file_name', shouldPass: true, description: 'snake_case should pass' },
      { name: 'myfilename', shouldPass: true, description: 'no delimiters should pass' },
      { name: 'MyFileName', shouldPass: true, description: 'PascalCase should pass' },
      { name: 'a-b-c-d', shouldPass: true, description: 'multiple hyphens should pass' },
      { name: 'a_b_c_d', shouldPass: true, description: 'multiple underscores should pass' },
      { name: 'a', shouldPass: true, description: 'single character should pass' },
      { name: 'ab', shouldPass: true, description: 'two characters should pass' },
      
      // Invalid names (mixed delimiters)
      { name: 'my-file_name', shouldPass: false, description: 'mixed - and _ should fail' },
      { name: 'my_file-name', shouldPass: false, description: 'mixed _ and - should fail' },
      { name: 'a-b_c', shouldPass: false, description: 'simple mixed should fail' },
      { name: 'a_b-c', shouldPass: false, description: 'simple mixed (reversed) should fail' },
      { name: 'my-file_name-test', shouldPass: false, description: 'complex mixed should fail' },
      { name: 'my_file-name_test', shouldPass: false, description: 'complex mixed (reversed) should fail' },
      { name: '-_', shouldPass: false, description: 'just delimiters should fail' },
      { name: '_-', shouldPass: false, description: 'just delimiters (reversed) should fail' },
    ];

    for (const { name, shouldPass, description } of testCases) {
      const result = validateUniRule5(name);
      
      if (shouldPass) {
        assert.strictEqual(result, null, `${description}: "${name}" expected null, got "${result}"`);
      } else {
        assert.notStrictEqual(result, null, `${description}: "${name}" expected error message, got null`);
        assert.ok(result!.includes('UniRule_5'), `${description}: error should mention UniRule_5`);
      }
    }
  });

  test('Property 4: UniRule_5 - empty string passes', () => {
    const result = validateUniRule5('');
    assert.strictEqual(result, null, 'Empty string should pass');
  });

  test('Property 4: UniRule_5 - dots are not considered delimiters for this rule', () => {
    // UniRule_5 only checks for mixing - and _, not .
    const testCases = [
      'my.file.name',
      'my-file.name',
      'my_file.name',
      'my.file-name',
      'my.file_name',
    ];

    for (const name of testCases) {
      const result = validateUniRule5(name);
      const hasMixed = name.includes('-') && name.includes('_');
      
      if (hasMixed) {
        assert.notStrictEqual(result, null, `"${name}" has mixed - and _, should fail`);
      } else {
        assert.strictEqual(result, null, `"${name}" has no mixed - and _, should pass`);
      }
    }
  });
});

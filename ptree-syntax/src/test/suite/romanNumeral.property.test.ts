import * as assert from 'assert';
import * as fc from 'fast-check';
import { isValidRomanNumeral, parseNumeralPrefix } from '../../core/parser';

/**
 * **Feature: ptree-completion, Property 6: Roman Numeral Validation**
 * **Validates: Requirements 4.5**
 * 
 * For any string claimed to be a Roman numeral, it should match the standard Roman numeral format (I-M, values 1-1000).
 */
suite('Roman Numeral Property Tests', () => {
  
  // Helper to convert a number to Roman numeral
  function toRoman(num: number): string {
    if (num <= 0 || num > 3999) return '';
    const romanNumerals: [number, string][] = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, symbol] of romanNumerals) {
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    return result;
  }

  // Helper to generate a string from a set of characters
  function stringFromChars(chars: string[], minLength: number, maxLength: number): fc.Arbitrary<string> {
    return fc.array(fc.constantFrom(...chars), { minLength, maxLength })
      .map(arr => arr.join(''));
  }

  test('Property 6: Roman Numeral Validation - valid numerals are accepted', () => {
    fc.assert(
      fc.property(
        // Generate integers from 1 to 3999 (valid Roman numeral range)
        fc.integer({ min: 1, max: 3999 }),
        (num) => {
          const roman = toRoman(num);
          return isValidRomanNumeral(roman);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: Roman Numeral Validation - invalid strings are rejected', () => {
    fc.assert(
      fc.property(
        // Generate strings that are NOT valid Roman numerals
        fc.oneof(
          // Empty string
          fc.constant(''),
          // Lowercase Roman numeral characters (always invalid)
          stringFromChars(['i', 'v', 'x', 'l', 'c', 'd', 'm'], 1, 10),
          // Invalid characters only
          stringFromChars(['A', 'B', 'E', 'F', 'G', 'H', 'J', 'K', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'W', 'Y', 'Z'], 1, 5),
          // Numbers
          stringFromChars(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], 1, 5),
          // Invalid Roman numeral patterns (too many repeats)
          fc.constant('IIII'),
          fc.constant('VV'),
          fc.constant('LL'),
          fc.constant('DD'),
          fc.constant('MMMM'),
          // Invalid subtractive combinations
          fc.constant('IC'),
          fc.constant('IL'),
          fc.constant('XD'),
          fc.constant('XM')
        ),
        (invalidStr) => {
          return !isValidRomanNumeral(invalidStr);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: Roman Numeral Validation - specific valid examples', () => {
    // Test specific known valid Roman numerals
    const validNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'XI', 'XX', 'XL', 'L', 'XC', 'C', 'CD', 'D', 'CM', 'M',
      'MCMXCIX', 'MMXXV', 'MMMCMXCIX'];
    
    for (const numeral of validNumerals) {
      assert.ok(isValidRomanNumeral(numeral), `Expected "${numeral}" to be valid`);
    }
  });

  test('Property 6: Roman Numeral Validation - specific invalid examples', () => {
    // Test specific known invalid Roman numerals
    const invalidNumerals = ['', 'IIII', 'VV', 'LL', 'DD', 'MMMM', 'IC', 'IL', 'XD', 'XM',
      'abc', '123', 'i', 'ii', 'iii'];
    
    for (const numeral of invalidNumerals) {
      assert.ok(!isValidRomanNumeral(numeral), `Expected "${numeral}" to be invalid`);
    }
  });

  test('parseNumeralPrefix extracts Roman numeral from directory names', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3999 }),
        stringFromChars(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '-'], 1, 20),
        (num, suffix) => {
          const roman = toRoman(num);
          const dirName = `${roman}_${suffix}`;
          const result = parseNumeralPrefix(dirName);
          return result.numeral === roman && result.remainder === suffix;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('parseNumeralPrefix returns null for non-numeral prefixes', () => {
    fc.assert(
      fc.property(
        // Generate strings that don't start with Roman numerals followed by underscore
        fc.oneof(
          fc.constant('readme'),
          fc.constant('src'),
          fc.constant('test-file'),
          fc.constant('no_numeral_here'),
          fc.constant('lowercase_i_intro')
        ),
        (name) => {
          const result = parseNumeralPrefix(name);
          return result.numeral === null && result.remainder === name;
        }
      ),
      { numRuns: 100 }
    );
  });
});

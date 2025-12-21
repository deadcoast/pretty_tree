import * as assert from 'assert';
import * as fc from 'fast-check';
import { deepMerge } from '../../core/config';

/**
 * **Feature: ptree-completion, Property 11: Config Merge Associativity**
 * **Validates: Requirements 1.4**
 * 
 * For any three configs A, B, C, merging (A merge B) merge C should equal
 * A merge (B merge C).
 */
suite('Config Merge Property Tests', () => {

  // Arbitrary for generating simple config-like objects
  const primitiveArb = fc.oneof(
    fc.string({ minLength: 0, maxLength: 10 }),
    fc.integer(),
    fc.boolean(),
    fc.constant(null)
  );

  // Arbitrary for generating arrays of primitives
  const arrayArb = fc.array(primitiveArb, { minLength: 0, maxLength: 5 });

  // Arbitrary for generating flat config objects
  const flatConfigArb = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    fc.oneof(primitiveArb, arrayArb),
    { minKeys: 0, maxKeys: 5 }
  );

  // Arbitrary for generating nested config objects (1 level deep)
  const nestedConfigArb: fc.Arbitrary<Record<string, unknown>> = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    fc.oneof(
      primitiveArb,
      arrayArb,
      flatConfigArb
    ),
    { minKeys: 0, maxKeys: 5 }
  );

  // Arbitrary for generating config objects with 2 levels of nesting
  const configArb: fc.Arbitrary<Record<string, unknown>> = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    fc.oneof(
      primitiveArb,
      arrayArb,
      nestedConfigArb
    ),
    { minKeys: 0, maxKeys: 5 }
  );

  /**
   * Deep equality check for config objects.
   */
  function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => deepEqual(val, b[i]));
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const aKeys = Object.keys(aObj);
      const bKeys = Object.keys(bObj);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
    }
    
    return false;
  }

  test('Property 11: Config Merge Associativity - (A merge B) merge C equals A merge (B merge C)', () => {
    fc.assert(
      fc.property(
        configArb,
        configArb,
        configArb,
        (a, b, c) => {
          // Left associative: (A merge B) merge C
          const leftAssoc = deepMerge(deepMerge(a, b), c);
          
          // Right associative: A merge (B merge C)
          const rightAssoc = deepMerge(a, deepMerge(b, c));
          
          return deepEqual(leftAssoc, rightAssoc);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Config Merge Associativity - specific examples', () => {
    // Example 1: Simple flat configs
    const a1 = { x: 1, y: 2 };
    const b1 = { y: 3, z: 4 };
    const c1 = { z: 5, w: 6 };
    
    const left1 = deepMerge(deepMerge(a1, b1), c1);
    const right1 = deepMerge(a1, deepMerge(b1, c1));
    assert.ok(deepEqual(left1, right1), 'Simple flat configs should be associative');
    
    // Example 2: Nested configs
    const a2 = { nested: { a: 1, b: 2 } };
    const b2 = { nested: { b: 3, c: 4 } };
    const c2 = { nested: { c: 5, d: 6 } };
    
    const left2 = deepMerge(deepMerge(a2, b2), c2);
    const right2 = deepMerge(a2, deepMerge(b2, c2));
    assert.ok(deepEqual(left2, right2), 'Nested configs should be associative');
    
    // Example 3: Mixed depth configs
    const a3 = { x: 1, nested: { a: 1 } };
    const b3 = { y: 2, nested: { b: 2 } };
    const c3 = { z: 3, nested: { c: 3 } };
    
    const left3 = deepMerge(deepMerge(a3, b3), c3);
    const right3 = deepMerge(a3, deepMerge(b3, c3));
    assert.ok(deepEqual(left3, right3), 'Mixed depth configs should be associative');
  });

  test('Property 11: Config Merge Associativity - empty configs', () => {
    fc.assert(
      fc.property(
        configArb,
        configArb,
        (a, b) => {
          const empty = {};
          
          // (A merge {}) merge B should equal A merge ({} merge B)
          const left = deepMerge(deepMerge(a, empty), b);
          const right = deepMerge(a, deepMerge(empty, b));
          
          return deepEqual(left, right);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Config Merge Associativity - identity property', () => {
    fc.assert(
      fc.property(
        configArb,
        (a) => {
          const empty = {};
          
          // A merge {} should equal A
          const merged = deepMerge(a, empty);
          return deepEqual(merged, a);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Config Merge Associativity - override semantics preserved', () => {
    fc.assert(
      fc.property(
        configArb,
        configArb,
        (a, b) => {
          const merged = deepMerge(a, b);
          
          // All keys from b should be in merged with b's values (for non-nested)
          for (const [key, value] of Object.entries(b)) {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
              if (merged[key] !== value) return false;
            }
          }
          
          // All keys from a that are not in b should be preserved
          for (const [key, value] of Object.entries(a)) {
            if (!(key in b)) {
              if (!deepEqual(merged[key], value)) return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

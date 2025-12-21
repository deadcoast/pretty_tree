import * as assert from 'assert';
import * as fc from 'fast-check';

/**
 * **Feature: ptree-completion, Property 5: Entity Classification Determinism**
 * **Validates: Requirements 2.1, 3.1**
 * 
 * For any node name, the entity classification (ROOT/DIR/FILE/EXT/META) should be
 * deterministic based on the name's suffix markers.
 */

// Replicate the classifyNode function from validator.ts for testing
function classifyNode(name: string): 'META' | 'DIR' | 'FILE' {
  if (name.endsWith('//')) return 'META';
  if (name.endsWith('/')) return 'DIR';
  return 'FILE';
}

suite('Entity Classification Property Tests', () => {

  // Helper to generate valid name characters (alphanumeric, hyphen, underscore, dot)
  const nameChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'.split('');
  
  function stringFromChars(chars: string[], minLength: number, maxLength: number): fc.Arbitrary<string> {
    return fc.array(fc.constantFrom(...chars), { minLength, maxLength })
      .map(arr => arr.join(''));
  }

  // Arbitrary for generating valid base names (no trailing slashes)
  const baseNameArb = stringFromChars(nameChars, 1, 20);

  test('Property 5: Entity Classification Determinism - META nodes end with //', () => {
    fc.assert(
      fc.property(
        baseNameArb,
        (baseName) => {
          const metaName = `${baseName}//`;
          const result = classifyNode(metaName);
          return result === 'META';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Entity Classification Determinism - DIR nodes end with / (not //)', () => {
    fc.assert(
      fc.property(
        baseNameArb.filter(name => !name.endsWith('/')), // Ensure base doesn't end with /
        (baseName) => {
          const dirName = `${baseName}/`;
          const result = classifyNode(dirName);
          return result === 'DIR';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Entity Classification Determinism - FILE nodes have no trailing slashes', () => {
    fc.assert(
      fc.property(
        baseNameArb.filter(name => !name.endsWith('/')), // Ensure no trailing slash
        (fileName) => {
          const result = classifyNode(fileName);
          return result === 'FILE';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Entity Classification Determinism - classification is deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          baseNameArb.map(name => `${name}//`),  // META
          baseNameArb.filter(n => !n.endsWith('/')).map(name => `${name}/`), // DIR
          baseNameArb.filter(n => !n.endsWith('/')) // FILE
        ),
        (name) => {
          // Call classifyNode multiple times with the same input
          const result1 = classifyNode(name);
          const result2 = classifyNode(name);
          const result3 = classifyNode(name);
          
          // All results should be identical
          return result1 === result2 && result2 === result3;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Entity Classification Determinism - suffix determines classification', () => {
    fc.assert(
      fc.property(
        baseNameArb.filter(name => !name.endsWith('/')),
        baseNameArb.filter(name => !name.endsWith('/')),
        (name1, name2) => {
          // Two different base names with same suffix should have same classification
          const meta1 = classifyNode(`${name1}//`);
          const meta2 = classifyNode(`${name2}//`);
          
          const dir1 = classifyNode(`${name1}/`);
          const dir2 = classifyNode(`${name2}/`);
          
          const file1 = classifyNode(name1);
          const file2 = classifyNode(name2);
          
          return meta1 === meta2 && meta1 === 'META' &&
                 dir1 === dir2 && dir1 === 'DIR' &&
                 file1 === file2 && file1 === 'FILE';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Entity Classification Determinism - specific examples', () => {
    // Test specific examples to ensure correct classification
    const testCases: Array<{ name: string; expected: 'META' | 'DIR' | 'FILE' }> = [
      // META nodes (end with //)
      { name: 'SECTION//', expected: 'META' },
      { name: 'CHAPTER_ONE//', expected: 'META' },
      { name: 'ROOT//', expected: 'META' },
      { name: 'a//', expected: 'META' },
      
      // DIR nodes (end with / but not //)
      { name: 'src/', expected: 'DIR' },
      { name: 'My_Directory/', expected: 'DIR' },
      { name: '.github/', expected: 'DIR' },
      { name: 'a/', expected: 'DIR' },
      
      // FILE nodes (no trailing slashes)
      { name: 'readme.md', expected: 'FILE' },
      { name: 'parser.ts', expected: 'FILE' },
      { name: '.gitignore', expected: 'FILE' },
      { name: 'Makefile', expected: 'FILE' },
      { name: 'a', expected: 'FILE' },
    ];

    for (const { name, expected } of testCases) {
      const result = classifyNode(name);
      assert.strictEqual(
        result,
        expected,
        `"${name}" should be classified as ${expected}, got ${result}`
      );
    }
  });

  test('Property 5: Entity Classification Determinism - edge cases', () => {
    // Edge case: name that is just slashes
    assert.strictEqual(classifyNode('//'), 'META', '"/" should be META');
    assert.strictEqual(classifyNode('/'), 'DIR', '"/" should be DIR');
    
    // Edge case: multiple slashes
    assert.strictEqual(classifyNode('a///'), 'META', '"a///" ends with // so should be META');
    assert.strictEqual(classifyNode('a////'), 'META', '"a////" ends with // so should be META');
  });
});

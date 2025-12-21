import * as assert from 'assert';
import * as fc from 'fast-check';

/**
 * **Feature: ptree-completion, Property 9: Sorting Transitivity (PT009)**
 * **Validates: Requirements 8.1, 8.2**
 * 
 * For any three sibling nodes A, B, C where A < B and B < C according to PT009 rules,
 * A < C must also hold.
 */

type FileSplitStrategy = 'lastDot' | 'firstDot';

/**
 * Classify a node as META, DIR, or FILE based on its name suffix.
 */
function classifyNode(name: string): 'META' | 'DIR' | 'FILE' {
  if (name.endsWith('//')) { return 'META'; }
  if (name.endsWith('/')) { return 'DIR'; }
  return 'FILE';
}

/**
 * Strip trailing markers (// or /) from a name.
 */
function stripTrailingMarkers(name: string): string {
  if (name.endsWith('//')) { return name.slice(0, -2); }
  if (name.endsWith('/')) { return name.slice(0, -1); }
  return name;
}

/**
 * Split a file name into stem and extension.
 */
function splitFileParts(fileName: string, strategy: FileSplitStrategy): { stem: string; ext: string | null } {
  if (fileName.startsWith('.') && fileName.indexOf('.', 1) === -1) {
    return { stem: fileName, ext: null };
  }

  const dot = strategy === 'firstDot' ? fileName.indexOf('.') : fileName.lastIndexOf('.');
  if (dot <= 0) { return { stem: fileName, ext: null }; }

  return {
    stem: fileName.slice(0, dot),
    ext: fileName.slice(dot + 1)
  };
}

/**
 * Get the sort key for a node name (used for PT009 sorting).
 */
function getSortKey(name: string, fileSplit: FileSplitStrategy): string {
  const kind = classifyNode(name);
  const bare = stripTrailingMarkers(name);
  return kind === 'FILE' ? splitFileParts(bare, fileSplit).stem : bare;
}

/**
 * Compare two node names for PT009 sorting.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
function comparePT009(
  aName: string,
  bName: string,
  fileSplit: FileSplitStrategy,
  caseSensitive: boolean
): number {
  const aKind = classifyNode(aName);
  const bKind = classifyNode(bName);
  
  // Rank: DIR/META before FILE
  const aRank = aKind === 'FILE' ? 1 : 0;
  const bRank = bKind === 'FILE' ? 1 : 0;
  if (aRank !== bRank) { return aRank - bRank; }

  const ak = getSortKey(aName, fileSplit);
  const bk = getSortKey(bName, fileSplit);
  const A = caseSensitive ? ak : ak.toLowerCase();
  const B = caseSensitive ? bk : bk.toLowerCase();
  
  if (A < B) { return -1; }
  if (A > B) { return 1; }
  return 0;
}

suite('PT009 Sorting Property Tests', () => {

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

  // Arbitrary for generating a directory name
  const dirNameArb = nameArb.map(name => `${name}/`);

  // Arbitrary for generating any node name (file or directory)
  const nodeNameArb = fc.oneof(fileNameArb, dirNameArb);

  // Arbitrary for file split strategy
  const fileSplitArb = fc.constantFrom<FileSplitStrategy>('lastDot', 'firstDot');

  // Arbitrary for case sensitivity
  const caseSensitiveArb = fc.boolean();

  test('Property 9: Sorting Transitivity - if A < B and B < C then A < C', () => {
    fc.assert(
      fc.property(
        nodeNameArb,
        nodeNameArb,
        nodeNameArb,
        fileSplitArb,
        caseSensitiveArb,
        (aName, bName, cName, fileSplit, caseSensitive) => {
          const ab = comparePT009(aName, bName, fileSplit, caseSensitive);
          const bc = comparePT009(bName, cName, fileSplit, caseSensitive);
          const ac = comparePT009(aName, cName, fileSplit, caseSensitive);
          
          // If A < B and B < C, then A < C must hold (transitivity)
          if (ab < 0 && bc < 0) {
            return ac < 0;
          }
          
          // If A > B and B > C, then A > C must hold
          if (ab > 0 && bc > 0) {
            return ac > 0;
          }
          
          // If A == B and B == C, then A == C must hold
          if (ab === 0 && bc === 0) {
            return ac === 0;
          }
          
          // Other cases don't constrain transitivity
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9: Sorting Transitivity - directories always come before files', () => {
    fc.assert(
      fc.property(
        dirNameArb,
        fileNameArb,
        fileSplitArb,
        caseSensitiveArb,
        (dirName, fileName, fileSplit, caseSensitive) => {
          const cmp = comparePT009(dirName, fileName, fileSplit, caseSensitive);
          // Directory should always be less than file
          return cmp < 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9: Sorting Transitivity - files always come after directories', () => {
    fc.assert(
      fc.property(
        fileNameArb,
        dirNameArb,
        fileSplitArb,
        caseSensitiveArb,
        (fileName, dirName, fileSplit, caseSensitive) => {
          const cmp = comparePT009(fileName, dirName, fileSplit, caseSensitive);
          // File should always be greater than directory
          return cmp > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9: Sorting Transitivity - same type nodes are sorted alphabetically', () => {
    fc.assert(
      fc.property(
        dirNameArb,
        dirNameArb,
        fileSplitArb,
        (dirA, dirB, fileSplit) => {
          const cmp = comparePT009(dirA, dirB, fileSplit, false);
          const keyA = getSortKey(dirA, fileSplit).toLowerCase();
          const keyB = getSortKey(dirB, fileSplit).toLowerCase();
          
          if (keyA < keyB) { return cmp < 0; }
          if (keyA > keyB) { return cmp > 0; }
          return cmp === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9: Sorting Transitivity - reflexivity (A == A)', () => {
    fc.assert(
      fc.property(
        nodeNameArb,
        fileSplitArb,
        caseSensitiveArb,
        (name, fileSplit, caseSensitive) => {
          const cmp = comparePT009(name, name, fileSplit, caseSensitive);
          return cmp === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9: Sorting Transitivity - antisymmetry (if A < B then B > A)', () => {
    fc.assert(
      fc.property(
        nodeNameArb,
        nodeNameArb,
        fileSplitArb,
        caseSensitiveArb,
        (aName, bName, fileSplit, caseSensitive) => {
          const ab = comparePT009(aName, bName, fileSplit, caseSensitive);
          const ba = comparePT009(bName, aName, fileSplit, caseSensitive);
          
          // Antisymmetry: if A < B then B > A, if A > B then B < A, if A == B then B == A
          if (ab < 0) { return ba > 0; }
          if (ab > 0) { return ba < 0; }
          return ba === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9: Sorting Transitivity - specific examples', () => {
    const testCases: Array<{
      a: string;
      b: string;
      c: string;
      description: string;
    }> = [
      {
        a: 'alpha/',
        b: 'beta/',
        c: 'gamma/',
        description: 'Three directories in alphabetical order'
      },
      {
        a: 'a.txt',
        b: 'b.txt',
        c: 'c.txt',
        description: 'Three files in alphabetical order'
      },
      {
        a: 'dir/',
        b: 'file.txt',
        c: 'zebra.txt',
        description: 'Directory before files'
      },
      {
        a: 'aaa/',
        b: 'zzz/',
        c: 'file.txt',
        description: 'All directories before any file'
      }
    ];

    for (const { a, b, c, description } of testCases) {
      const ab = comparePT009(a, b, 'lastDot', false);
      const bc = comparePT009(b, c, 'lastDot', false);
      const ac = comparePT009(a, c, 'lastDot', false);
      
      // Verify transitivity
      if (ab < 0 && bc < 0) {
        assert.ok(ac < 0, `${description}: transitivity failed - A < B and B < C but A >= C`);
      }
    }
  });
});

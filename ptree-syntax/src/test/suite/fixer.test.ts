import * as assert from 'assert';

import { parsePtreeDocument } from '../../core/parser';
import { applyCanonicalFixes } from '../../core/fixer';
import { PtreeConfig } from '../../core/config';

const SPEC_CONFIG: PtreeConfig = {
  ptree: 'spec',
  style: 'unicode',
  profile: 'spec',
  NAME_TYPES: {}
};

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

suite('Fixer Tests', () => {
  test('renames legacy delimiter directive in spec mode', () => {
    const text = `@ptree: spec
@style: unicode
@version: 1.0.0
@seperation_delimiters: [
    '-',
    '_',
    '.'
]

PTREE-1.0.0//`;
    const doc = parsePtreeDocument(text);
    const res = applyCanonicalFixes(text, doc, SPEC_CONFIG);

    assert.ok(res.fixedText.includes('@separation_delimiters: ['));
    assert.ok(!res.fixedText.includes('@seperation_delimiters: ['));
  });

  test('preserves inline metadata when applying fixes', () => {
    const text = `@ptree: 1.0
ROOT//
├── Folder
│   └── File.TXT  # note`;
    const doc = parsePtreeDocument(text);
    const res = applyCanonicalFixes(text, doc, DEFAULT_CONFIG);

    assert.ok(res.fixedText.includes('Folder/'));
    assert.ok(res.fixedText.includes('File.txt  # note'));
  });

  test('PT009: sorts directories first, then files, alphabetically', () => {
    // Input with unsorted nodes: files before directories, not alphabetical
    const text = `@ptree: 1.0
ROOT//
├── zebra.txt
├── alpha/
├── beta.txt
└── gamma/`;
    const doc = parsePtreeDocument(text);
    const res = applyCanonicalFixes(text, doc, PT009_ENABLED_CONFIG);

    const lines = res.fixedText.split('\n');
    
    // Find the node lines (after root)
    const nodeLines = lines.filter(l => l.includes('├──') || l.includes('└──'));
    
    // Should be sorted: directories first (alpha/, gamma/), then files (beta.txt, zebra.txt)
    assert.strictEqual(nodeLines.length, 4);
    assert.ok(nodeLines[0].includes('alpha/'), 'First should be alpha/ (directory, alphabetically first)');
    assert.ok(nodeLines[1].includes('gamma/'), 'Second should be gamma/ (directory, alphabetically second)');
    assert.ok(nodeLines[2].includes('beta.txt'), 'Third should be beta.txt (file, alphabetically first)');
    assert.ok(nodeLines[3].includes('zebra.txt'), 'Fourth should be zebra.txt (file, alphabetically second)');
    
    assert.ok(res.applied.some(a => a.includes('PT009')), 'Should report PT009 fix was applied');
  });

  test('PT009: sorts nested nodes correctly', () => {
    const text = `@ptree: 1.0
ROOT//
├── src/
│   ├── z-file.ts
│   ├── a-dir/
│   └── b-file.ts
└── readme.md`;
    const doc = parsePtreeDocument(text);
    const res = applyCanonicalFixes(text, doc, PT009_ENABLED_CONFIG);
    
    // Check that nested nodes are also sorted
    assert.ok(res.fixedText.includes('a-dir/'), 'Should contain a-dir/');
    
    // The directory should come before files in the nested level
    const aIndex = res.fixedText.indexOf('a-dir/');
    const bIndex = res.fixedText.indexOf('b-file.ts');
    const zIndex = res.fixedText.indexOf('z-file.ts');
    
    assert.ok(aIndex < bIndex, 'a-dir/ should come before b-file.ts');
    assert.ok(aIndex < zIndex, 'a-dir/ should come before z-file.ts');
    assert.ok(bIndex < zIndex, 'b-file.ts should come before z-file.ts (alphabetically)');
  });

  test('PT009: does not sort when disabled', () => {
    const text = `@ptree: 1.0
ROOT//
├── zebra.txt
├── alpha/
└── beta.txt`;
    const doc = parsePtreeDocument(text);
    const res = applyCanonicalFixes(text, doc, DEFAULT_CONFIG);

    // Without PT009 enabled, order should be preserved
    const lines = res.fixedText.split('\n');
    const nodeLines = lines.filter(l => l.includes('├──') || l.includes('└──'));
    
    // Order should be unchanged (zebra.txt, alpha/, beta.txt)
    assert.ok(nodeLines[0].includes('zebra.txt'), 'First should still be zebra.txt');
    assert.ok(nodeLines[1].includes('alpha/'), 'Second should still be alpha/');
    assert.ok(nodeLines[2].includes('beta.txt'), 'Third should still be beta.txt');
    
    assert.ok(!res.applied.some(a => a.includes('PT009')), 'Should not report PT009 fix');
  });

  test('PT009: already sorted document is not modified', () => {
    const text = `@ptree: 1.0
ROOT//
├── alpha/
├── gamma/
├── beta.txt
└── zebra.txt`;
    const doc = parsePtreeDocument(text);
    const res = applyCanonicalFixes(text, doc, PT009_ENABLED_CONFIG);

    // Already sorted, so no PT009 fix should be applied
    assert.ok(!res.applied.some(a => a.includes('PT009')), 'Should not report PT009 fix for already sorted document');
  });
});

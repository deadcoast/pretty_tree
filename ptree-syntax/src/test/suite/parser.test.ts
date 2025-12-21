import * as assert from 'assert';
import { parsePtreeDocument, parseSummaryLine } from '../../core/parser';

suite('Parser Tests', () => {
  test('parses empty document', () => {
    const doc = parsePtreeDocument('');
    assert.strictEqual(doc.nodes.length, 0);
    assert.strictEqual(doc.root, undefined);
  });

  test('parses directives', () => {
    const text = `@ptree: spec
@style: unicode
@version: 0.0.1`;
    const doc = parsePtreeDocument(text);
    
    assert.strictEqual(doc.directives['ptree'], 'spec');
    assert.strictEqual(doc.directives['style'], 'unicode');
    assert.strictEqual(doc.directives['version'], '0.0.1');
  });

  test('parses multi-line directive blocks', () => {
    const text = `@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type'
]`;
    const doc = parsePtreeDocument(text);
    
    assert.ok(doc.directives['name_type']);
    assert.ok(doc.directives['name_type'].includes('SCREAM_TYPE'));
    assert.ok(doc.directives['name_type'].includes('High_Type'));
  });

  test('parses root label', () => {
    const text = `PTREE-0.0.1//`;
    const doc = parsePtreeDocument(text);
    
    assert.ok(doc.root);
    assert.strictEqual(doc.root.kind, 'rootLabel');
    assert.strictEqual(doc.root.value, 'PTREE-0.0.1//');
  });

  test('parses root path', () => {
    const text = `my-project/`;
    const doc = parsePtreeDocument(text);
    
    assert.ok(doc.root);
    assert.strictEqual(doc.root.kind, 'rootPath');
  });

  test('parses unicode tree nodes', () => {
    const text = `PTREE-0.0.1//
├── readme.md
├── Src/
│   └── index.ts
└── Tests/`;
    const doc = parsePtreeDocument(text);
    
    assert.strictEqual(doc.nodes.length, 4);
    assert.strictEqual(doc.nodes[0].name, 'readme.md');
    assert.strictEqual(doc.nodes[0].depth, 0);
    assert.strictEqual(doc.nodes[1].name, 'Src/');
    assert.strictEqual(doc.nodes[2].name, 'index.ts');
    assert.strictEqual(doc.nodes[2].depth, 1);
  });

  test('parses ascii tree nodes', () => {
    const text = `my-project/
|-- readme.md
\`-- src/
    \`-- index.ts`;
    const doc = parsePtreeDocument(text);
    
    assert.strictEqual(doc.nodes.length, 3);
    assert.strictEqual(doc.nodes[0].name, 'readme.md');
    assert.strictEqual(doc.nodes[1].name, 'src/');
    assert.strictEqual(doc.nodes[2].name, 'index.ts');
    assert.strictEqual(doc.nodes[2].depth, 1);
  });

  test('detects hasChildren', () => {
    const text = `ROOT//
├── Parent/
│   └── child.txt
└── file.txt`;
    const doc = parsePtreeDocument(text);
    
    const parent = doc.nodes.find(n => n.name === 'Parent/');
    const child = doc.nodes.find(n => n.name === 'child.txt');
    const file = doc.nodes.find(n => n.name === 'file.txt');
    
    assert.ok(parent?.hasChildren);
    assert.ok(!child?.hasChildren);
    assert.ok(!file?.hasChildren);
  });

  test('strips inline metadata', () => {
    const text = `ROOT//
├── file.txt  # comment
├── other.md  [attr=value]`;
    const doc = parsePtreeDocument(text);
    
    assert.strictEqual(doc.nodes[0].name, 'file.txt');
    assert.strictEqual(doc.nodes[1].name, 'other.md');
  });

  test('handles symlinks', () => {
    const text = `ROOT//
└── link -> target/`;
    const doc = parsePtreeDocument(text);
    
    assert.strictEqual(doc.nodes[0].name, 'link');
  });

  test('captures trailing metadata and symlink targets', () => {
    const text = `ROOT//
├── file.txt  # comment
└── link -> target/  [attr=value]`;
    const doc = parsePtreeDocument(text);

    const file = doc.nodes[0];
    const link = doc.nodes[1];

    assert.strictEqual(file.trailing, '  # comment');
    assert.strictEqual(file.symlinkTarget, undefined);

    assert.strictEqual(link.trailing, ' -> target/  [attr=value]');
    assert.strictEqual(link.symlinkTarget, 'target/');
  });

  test('detects depth jumps', () => {
    const text = `ROOT//
├── file.txt
│       └── deep.txt`;
    const doc = parsePtreeDocument(text);
    
    // Should have error about depth jump
    assert.ok(doc.errors.some(e => e.message.includes('depth') || e.message.includes('jump')));
  });

  test('parses Roman numeral prefixed directories', () => {
    const text = `ROOT//
├── I_Introduction/
├── II_Content/
│   └── chapter.md
├── III_Conclusion/
└── IV_Appendix/`;
    const doc = parsePtreeDocument(text);
    
    assert.strictEqual(doc.nodes.length, 5);
    
    const intro = doc.nodes.find(n => n.name === 'I_Introduction/');
    const content = doc.nodes.find(n => n.name === 'II_Content/');
    const conclusion = doc.nodes.find(n => n.name === 'III_Conclusion/');
    const appendix = doc.nodes.find(n => n.name === 'IV_Appendix/');
    
    assert.strictEqual(intro?.numeralPrefix, 'I');
    assert.strictEqual(content?.numeralPrefix, 'II');
    assert.strictEqual(conclusion?.numeralPrefix, 'III');
    assert.strictEqual(appendix?.numeralPrefix, 'IV');
    
    // Non-directory nodes should not have numeral prefix
    const chapter = doc.nodes.find(n => n.name === 'chapter.md');
    assert.strictEqual(chapter?.numeralPrefix, undefined);
  });

  test('does not parse invalid Roman numeral prefixes', () => {
    const text = `ROOT//
├── IIII_Invalid/
├── VV_AlsoInvalid/
└── regular_dir/`;
    const doc = parsePtreeDocument(text);
    
    // IIII and VV are not valid Roman numerals
    const invalid1 = doc.nodes.find(n => n.name === 'IIII_Invalid/');
    const invalid2 = doc.nodes.find(n => n.name === 'VV_AlsoInvalid/');
    const regular = doc.nodes.find(n => n.name === 'regular_dir/');
    
    assert.strictEqual(invalid1?.numeralPrefix, undefined);
    assert.strictEqual(invalid2?.numeralPrefix, undefined);
    assert.strictEqual(regular?.numeralPrefix, undefined);
  });

  test('parses index file prefix', () => {
    const text = `ROOT//
├── (index).md
├── (index)-introduction.md
├── (index)_chapter.md
└── regular-file.md`;
    const doc = parsePtreeDocument(text);
    
    assert.strictEqual(doc.nodes.length, 4);
    
    const index1 = doc.nodes.find(n => n.name === '(index).md');
    const index2 = doc.nodes.find(n => n.name === '(index)-introduction.md');
    const index3 = doc.nodes.find(n => n.name === '(index)_chapter.md');
    const regular = doc.nodes.find(n => n.name === 'regular-file.md');
    
    assert.strictEqual(index1?.isIndexFile, true);
    assert.strictEqual(index2?.isIndexFile, true);
    assert.strictEqual(index3?.isIndexFile, true);
    assert.strictEqual(regular?.isIndexFile, undefined);
  });

  test('does not mark directories as index files', () => {
    const text = `ROOT//
├── (index)/
└── (index)-dir/`;
    const doc = parsePtreeDocument(text);
    
    // Directories should not be marked as index files
    const dir1 = doc.nodes.find(n => n.name === '(index)/');
    const dir2 = doc.nodes.find(n => n.name === '(index)-dir/');
    
    assert.strictEqual(dir1?.isIndexFile, undefined);
    assert.strictEqual(dir2?.isIndexFile, undefined);
  });

  test('parses summary line', () => {
    const text = `ROOT//
├── Src/
│   └── index.ts
└── readme.md

8 directories, 20 files`;
    const doc = parsePtreeDocument(text);
    
    assert.ok(doc.summaryLine);
    assert.strictEqual(doc.summaryLine.directories, 8);
    assert.strictEqual(doc.summaryLine.files, 20);
    assert.strictEqual(doc.summaryLine.raw, '8 directories, 20 files');
    
    // Summary line should not be in nodes
    assert.strictEqual(doc.nodes.length, 3);
  });

  test('parses summary line with singular forms', () => {
    const text = `ROOT//
└── file.txt

1 directory, 1 file`;
    const doc = parsePtreeDocument(text);
    
    assert.ok(doc.summaryLine);
    assert.strictEqual(doc.summaryLine.directories, 1);
    assert.strictEqual(doc.summaryLine.files, 1);
  });

  test('parseSummaryLine function', () => {
    // Valid summary lines
    assert.deepStrictEqual(parseSummaryLine('8 directories, 20 files'), { directories: 8, files: 20 });
    assert.deepStrictEqual(parseSummaryLine('1 directory, 1 file'), { directories: 1, files: 1 });
    assert.deepStrictEqual(parseSummaryLine('  3 directories, 5 files  '), { directories: 3, files: 5 });
    
    // Invalid lines
    assert.strictEqual(parseSummaryLine('not a summary'), null);
    assert.strictEqual(parseSummaryLine('8 dirs, 20 files'), null);
    assert.strictEqual(parseSummaryLine(''), null);
  });

  test('summary line does not affect tree structure', () => {
    const text = `ROOT//
├── Src/
│   └── index.ts
└── readme.md

3 directories, 2 files`;
    const doc = parsePtreeDocument(text);
    
    // Verify tree structure is correct
    assert.strictEqual(doc.nodes.length, 3);
    assert.strictEqual(doc.nodes[0].name, 'Src/');
    assert.strictEqual(doc.nodes[0].hasChildren, true);
    assert.strictEqual(doc.nodes[1].name, 'index.ts');
    assert.strictEqual(doc.nodes[1].depth, 1);
    assert.strictEqual(doc.nodes[2].name, 'readme.md');
    
    // Summary line is stored separately
    assert.ok(doc.summaryLine);
  });
});

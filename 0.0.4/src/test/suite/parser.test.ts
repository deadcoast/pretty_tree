import * as assert from 'assert';
import { parsePtreeDocument } from '../../core/parser';

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
});

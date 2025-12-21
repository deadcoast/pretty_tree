import * as assert from 'assert';
import { parsePtreeDocument } from '../../core/parser';
import { validatePtreeDocument } from '../../core/validator';
import { PtreeConfig } from '../../core/config';

const DEFAULT_CONFIG: PtreeConfig = {
  ptree: '1.0',
  style: 'unicode',
  NAME_TYPES: {
    'SCREAM_TYPE': {
      description: 'SCREAMING_SNAKE_CASE',
      word_delimiter: '_',
      allowed_version_delimiters: ['-'],
      pattern: '^[A-Z0-9]+(?:_[A-Z0-9]+)*$'
    },
    'High_Type': {
      description: 'Pascal_Snake_Case',
      word_delimiter: '_',
      allowed_version_delimiters: ['-'],
      pattern: '^[A-Z][A-Za-z0-9]*(?:_[A-Z][A-Za-z0-9]*)*$'
    },
    'smol-type': {
      description: 'kebab-case',
      word_delimiter: '-',
      allowed_version_delimiters: ['_'],
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    },
    'dot.smol-type': {
      description: 'Dot-separated kebab segments',
      word_delimiter: '.',
      allowed_version_delimiters: ['_', '-'],
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*(?:\\.[a-z0-9]+(?:-[a-z0-9]+)*)+$'
    }
  },
  ENTITY_NAME_TYPES: {
    ROOT: ['SCREAM_TYPE'],
    DIR: ['High_Type'],
    FILE: ['smol-type', 'dot.smol-type'],
    META: ['SCREAM_TYPE']
  },
  RULES: {
    default: true,
    PT001: { enabled: true, severity: 'error', root_marker: '//' },
    PT002: { enabled: true, severity: 'error', mode: 'parents' },
    PT003: { enabled: true, severity: 'warning' },
    PT004: { enabled: true, severity: 'error' },
    PT005: { enabled: true, severity: 'error' },
    PT006: { enabled: true, severity: 'error' },
    PT007: { enabled: true, severity: 'warning' },
    PT008: { enabled: true, severity: 'warning' },
    PT009: { enabled: false, severity: 'warning' }
  }
};

suite('Validator Tests', () => {
  test('PT001: validates root marker', () => {
    const text = `@ptree: 1.0
my-project/`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const pt001 = msgs.find(m => m.code === 'PT001');
    assert.ok(pt001, 'Should report PT001 for root without //');
  });

  test('PT001: passes with valid root label', () => {
    const text = `@ptree: 1.0
PTREE-0.0.1//`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const pt001 = msgs.find(m => m.code === 'PT001');
    assert.ok(!pt001, 'Should not report PT001 for valid root label');
  });

  test('PT002: validates directory marker', () => {
    const text = `@ptree: 1.0
PTREE//
├── Parent
│   └── child.txt`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const pt002 = msgs.find(m => m.code === 'PT002');
    assert.ok(pt002, 'Should report PT002 for parent without /');
  });

  test('PT003: validates @ptree directive', () => {
    const text = `PTREE//
├── file.txt`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const pt003 = msgs.find(m => m.code === 'PT003');
    assert.ok(pt003, 'Should report PT003 for missing @ptree');
  });

  test('PT004: validates NAME_TYPES', () => {
    const text = `@ptree: 1.0
PTREE//
├── invalid-dir/
│   └── file.txt`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    // invalid-dir uses kebab-case, not High_Type (Pascal_Snake_Case)
    const pt004 = msgs.find(m => m.code === 'PT004');
    assert.ok(pt004, 'Should report PT004 for non-matching name type');
  });

  test('PT005: validates version delimiter', () => {
    const text = `@ptree: 1.0
PTREE_0.0.1//`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    // SCREAM_TYPE uses _ as word delimiter, so _ can't be version delimiter
    const pt005 = msgs.find(m => m.code === 'PT005');
    assert.ok(pt005, 'Should report PT005 for matching delimiters');
  });

  test('PT006: validates spaces in names', () => {
    const text = `@ptree: 1.0
PTREE//
├── my file.txt`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const pt006 = msgs.find(m => m.code === 'PT006');
    assert.ok(pt006, 'Should report PT006 for spaces in name');
  });

  test('PT007: validates extension casing', () => {
    const text = `@ptree: 1.0
PTREE//
├── file.MD`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const pt007 = msgs.find(m => m.code === 'PT007');
    assert.ok(pt007, 'Should report PT007 for uppercase extension');
  });

  test('PT008: validates mixed delimiters', () => {
    const text = `@ptree: 1.0
PTREE//
├── my-file_name.txt`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const pt008 = msgs.find(m => m.code === 'PT008');
    assert.ok(pt008, 'Should report PT008 for mixed - and _');
  });

  test('PT004: validates META nodes against META NAME_TYPE', () => {
    const text = `@ptree: 1.0
PTREE//
├── invalid-meta//`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    // invalid-meta uses kebab-case, not SCREAM_TYPE
    const pt004 = msgs.find(m => m.code === 'PT004' && m.message.includes('META'));
    assert.ok(pt004, 'Should report PT004 for META node not matching SCREAM_TYPE');
    assert.ok(pt004.message.includes('invalid-meta'), 'Error message should include the invalid name');
  });

  test('PT004: passes with valid META node', () => {
    const text = `@ptree: 1.0
PTREE//
├── VALID_META//`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const pt004 = msgs.find(m => m.code === 'PT004' && m.message.includes('META'));
    assert.ok(!pt004, 'Should not report PT004 for valid META node');
  });

  test('classifies nodes ending with // as META', () => {
    const text = `@ptree: 1.0
PTREE//
├── SECTION_ONE//
├── Dir/
│   └── file.txt`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    // SECTION_ONE// should be classified as META and validated against SCREAM_TYPE
    const metaError = msgs.find(m => m.code === 'PT004' && m.message.includes('SECTION_ONE'));
    assert.ok(!metaError, 'SECTION_ONE// should be valid as META (SCREAM_TYPE)');
  });

  test('clean document has no errors', () => {
    const text = `@ptree: 1.0
PTREE-0.0.1//
├── readme.md
├── Src/
│   └── index.ts
└── Tests/
    └── parser.test.ts`;
    const doc = parsePtreeDocument(text);
    const msgs = validatePtreeDocument(doc, DEFAULT_CONFIG);
    
    const errors = msgs.filter(m => m.severity === 'error');
    assert.strictEqual(errors.length, 0, `Unexpected errors: ${JSON.stringify(errors)}`);
  });
});

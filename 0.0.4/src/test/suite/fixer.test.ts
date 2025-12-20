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
    assert.ok(res.fixedText.includes('file.txt  # note'));
  });
});

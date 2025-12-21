import * as assert from 'assert';

import { parsePtreeDocument } from '../../core/parser';
import { PtreeFormattingProvider } from '../../formatter';
import { PtreeConfig } from '../../core/config';

const SPEC_CONFIG: PtreeConfig = {
  ptree: 'spec',
  style: 'unicode',
  profile: 'spec',
  NAME_TYPES: {}
};

suite('Formatter Tests', () => {
  test('preserves trailing metadata and symlink targets', () => {
    const text = `@ptree: spec
@style: unicode
@version: 1.0.0

PTREE-1.0.0//
├── Folder  [role=src]
│   └── File.TXT  # note
└── link -> target/  [attr=value]`;
    const doc = parsePtreeDocument(text);

    const provider = new PtreeFormattingProvider(() => {
      throw new Error('Unused');
    });

    const formatted = (provider as any).formatDocument(text, doc, SPEC_CONFIG, 'spec') as string;

    assert.ok(formatted.includes('Folder/  [role=src]'));
    assert.ok(formatted.includes('file.txt  # note'));
    assert.ok(formatted.includes('link -> target/  [attr=value]'));
    assert.ok(formatted.includes('@separation_delimiters: ['));
  });
});

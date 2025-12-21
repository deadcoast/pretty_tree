import * as assert from 'assert';
import * as fc from 'fast-check';
import { parsePtreeDocument } from '../../core/parser';
import { validatePtreeDocument, LintMessage } from '../../core/validator';
import { PtreeConfig } from '../../core/config';

/**
 * **Feature: docs-implementation-alignment, Property 3: Profile Validation Difference**
 * **Validates: Requirements 15.2**
 * 
 * For any ptree document that is valid under the default profile, when validated
 * under the spec profile with missing canonical headers, it should produce
 * additional validation errors.
 */

// Default profile config (flexible)
const DEFAULT_CONFIG: PtreeConfig = {
  ptree: '1.0',
  style: 'unicode',
  profile: 'default',
  NAME_TYPES: {
    'SCREAM_TYPE': {
      pattern: '^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$',
      word_delimiter: '_',
      allowed_version_delimiters: ['-'],
      examples: ['ROOT', 'MY_PROJECT', 'PTREE']
    },
    'High_Type': {
      pattern: '^[A-Z][a-z0-9]*(?:_[A-Z][a-z0-9]*)*$',
      word_delimiter: '_',
      allowed_version_delimiters: ['-'],
      examples: ['My_Dir', 'Some_Folder']
    },
    'smol-type': {
      pattern: '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
      word_delimiter: '-',
      allowed_version_delimiters: ['_'],
      examples: ['my-file', 'some-name']
    },
    'Cap-Type': {
      pattern: '^[A-Z][A-Za-z0-9]*(?:-[A-Z][A-Za-z0-9]*)*$',
      word_delimiter: '-',
      allowed_version_delimiters: ['_'],
      examples: ['User-Guide', 'Api-Docs']
    },
    'CamelType': {
      pattern: '^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$',
      word_delimiter: null,
      allowed_version_delimiters: ['-', '_'],
      examples: ['ProjectDocs', 'BuildTools']
    },
    'dotfile': {
      pattern: '^\\.[A-Za-z0-9][A-Za-z0-9._-]*$',
      word_delimiter: null,
      allowed_version_delimiters: ['-', '_'],
      examples: ['.gitignore', '.env']
    },
    'dotdir': {
      pattern: '^\\.[A-Za-z0-9][A-Za-z0-9._-]*$',
      word_delimiter: null,
      allowed_version_delimiters: ['-', '_'],
      examples: ['.github', '.vscode']
    }
  },
  ENTITY_NAME_TYPES: {
    ROOT: ['SCREAM_TYPE'],
    DIR: ['High_Type', 'Cap-Type', 'CamelType', 'dotdir'],
    FILE: ['smol-type', 'dotfile']
  },
  RULES: {
    default: true,
    PT003: { enabled: true, severity: 'warning' },
    PT010: { enabled: false },
    PT011: { enabled: false },
    PT012: { enabled: false },
    PT013: { enabled: false },
    PT014: { enabled: false },
    PT015: { enabled: false }
  }
};

// Spec profile config (strict canonical requirements)
const SPEC_CONFIG: PtreeConfig = {
  ptree: 'spec',
  style: 'unicode',
  profile: 'spec',
  NAME_TYPES: DEFAULT_CONFIG.NAME_TYPES,
  ENTITY_NAME_TYPES: {
    ROOT: ['SCREAM_TYPE'],
    DIR: ['High_Type'],
    FILE: ['smol-type']
  },
  RULES: {
    default: true,
    PT003: { enabled: true, severity: 'error' },
    PT010: { enabled: true, severity: 'error' },
    PT011: { enabled: true, severity: 'error' },
    PT012: { enabled: true, severity: 'error' },
    PT013: { enabled: true, severity: 'error' },
    PT014: { enabled: true, severity: 'error' },
    PT015: { enabled: true, severity: 'error' }
  }
};

suite('Profile Validation Difference Property Tests', () => {

  // Arbitrary for generating valid directory names (High_Type)
  const dirNameArb = fc.constantFrom(
    'Src/',
    'Docs/',
    'Tests/',
    'Core/',
    'Utils/',
    'Config/',
    'Build/',
    'Scripts/'
  );

  // Arbitrary for generating valid file names (smol-type)
  const fileNameArb = fc.constantFrom(
    'readme.md',
    'index.ts',
    'config.json',
    'parser.ts',
    'validator.ts',
    'helpers.ts',
    'main.ts',
    'test.ts'
  );

  // Arbitrary for generating a simple valid tree structure
  const simpleTreeArb = fc.tuple(
    fc.array(dirNameArb, { minLength: 0, maxLength: 3 }),
    fc.array(fileNameArb, { minLength: 1, maxLength: 3 })
  ).map(([dirs, files]) => {
    const lines: string[] = ['ROOT//'];
    const allNodes = [...dirs, ...files];
    for (let i = 0; i < allNodes.length; i++) {
      const isLast = i === allNodes.length - 1;
      const scaffold = isLast ? '└──' : '├──';
      lines.push(`${scaffold} ${allNodes[i]}`);
    }
    return lines.join('\n');
  });

  // Generate a document valid under default profile but missing spec headers
  const defaultValidDocArb = fc.tuple(
    fc.constantFrom('@ptree: default', '@ptree: 1.0', ''),
    fc.constantFrom('@style: unicode', '@style: ascii', ''),
    simpleTreeArb
  ).map(([ptreeDir, styleDir, tree]) => {
    const parts = [ptreeDir, styleDir, tree].filter(p => p !== '');
    return parts.join('\n');
  });

  /**
   * Helper to check if a document has spec-profile-specific errors (PT010-PT015)
   */
  function hasSpecProfileErrors(messages: LintMessage[]): boolean {
    const specRuleCodes = ['PT010', 'PT011', 'PT012', 'PT013', 'PT014', 'PT015'];
    return messages.some(m => specRuleCodes.includes(m.code));
  }

  /**
   * Helper to count errors by rule code
   */
  function countByCode(messages: LintMessage[], code: string): number {
    return messages.filter(m => m.code === code).length;
  }

  test('Property 3: Documents valid under default profile produce additional errors under spec profile', () => {
    fc.assert(
      fc.property(
        defaultValidDocArb,
        (ptreeText) => {
          const doc = parsePtreeDocument(ptreeText);
          
          // Validate under default profile
          const defaultMessages = validatePtreeDocument(doc, DEFAULT_CONFIG);
          
          // Validate under spec profile
          const specMessages = validatePtreeDocument(doc, SPEC_CONFIG);
          
          // Spec profile should produce additional errors (PT010-PT015)
          // since the document lacks canonical headers
          const hasAdditionalSpecErrors = hasSpecProfileErrors(specMessages);
          
          // The spec profile should have at least as many errors as default
          // plus the spec-specific header errors
          return hasAdditionalSpecErrors && specMessages.length >= defaultMessages.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Missing @ptree: spec triggers PT010 under spec profile only', () => {
    fc.assert(
      fc.property(
        simpleTreeArb,
        (tree) => {
          // Document with @ptree: default (not spec)
          const ptreeText = `@ptree: default\n@style: unicode\n${tree}`;
          const doc = parsePtreeDocument(ptreeText);
          
          // Default profile should not trigger PT010
          const defaultMessages = validatePtreeDocument(doc, DEFAULT_CONFIG);
          const defaultPT010 = countByCode(defaultMessages, 'PT010');
          
          // Spec profile should trigger PT010
          const specMessages = validatePtreeDocument(doc, SPEC_CONFIG);
          const specPT010 = countByCode(specMessages, 'PT010');
          
          return defaultPT010 === 0 && specPT010 > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Missing @version triggers PT012 under spec profile only', () => {
    fc.assert(
      fc.property(
        simpleTreeArb,
        (tree) => {
          // Document without @version directive
          const ptreeText = `@ptree: spec\n@style: unicode\n${tree}`;
          const doc = parsePtreeDocument(ptreeText);
          
          // Default profile should not trigger PT012
          const defaultMessages = validatePtreeDocument(doc, DEFAULT_CONFIG);
          const defaultPT012 = countByCode(defaultMessages, 'PT012');
          
          // Spec profile should trigger PT012
          const specMessages = validatePtreeDocument(doc, SPEC_CONFIG);
          const specPT012 = countByCode(specMessages, 'PT012');
          
          return defaultPT012 === 0 && specPT012 > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Missing @name_type block triggers PT013 under spec profile only', () => {
    fc.assert(
      fc.property(
        simpleTreeArb,
        (tree) => {
          // Document without @name_type block
          const ptreeText = `@ptree: spec\n@style: unicode\n@version: 1.0.0\n${tree}`;
          const doc = parsePtreeDocument(ptreeText);
          
          // Default profile should not trigger PT013
          const defaultMessages = validatePtreeDocument(doc, DEFAULT_CONFIG);
          const defaultPT013 = countByCode(defaultMessages, 'PT013');
          
          // Spec profile should trigger PT013
          const specMessages = validatePtreeDocument(doc, SPEC_CONFIG);
          const specPT013 = countByCode(specMessages, 'PT013');
          
          return defaultPT013 === 0 && specPT013 > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Fully canonical document passes both profiles', () => {
    // A document with all canonical headers should pass spec profile
    const canonicalDoc = `@ptree: spec
@style: unicode
@version: 1.0.0
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type'
]
@separation_delimiters: [
    '-',
    '_',
    '.'
]

PTREE-1.0.0//
├── Src/
│   └── main.ts
└── readme.md`;

    const doc = parsePtreeDocument(canonicalDoc);
    
    // Should pass default profile
    const defaultMessages = validatePtreeDocument(doc, DEFAULT_CONFIG);
    const defaultErrors = defaultMessages.filter(m => m.severity === 'error');
    
    // Should pass spec profile (no PT010-PT015 errors)
    const specMessages = validatePtreeDocument(doc, SPEC_CONFIG);
    const specHeaderErrors = specMessages.filter(m => 
      ['PT010', 'PT011', 'PT012', 'PT013', 'PT014', 'PT015'].includes(m.code)
    );
    
    assert.strictEqual(defaultErrors.length, 0, 
      `Default profile should have no errors, got: ${JSON.stringify(defaultErrors)}`);
    assert.strictEqual(specHeaderErrors.length, 0, 
      `Spec profile should have no header errors, got: ${JSON.stringify(specHeaderErrors)}`);
  });

  test('Property 3: Spec profile error count is always >= default profile error count', () => {
    fc.assert(
      fc.property(
        defaultValidDocArb,
        (ptreeText) => {
          const doc = parsePtreeDocument(ptreeText);
          
          const defaultMessages = validatePtreeDocument(doc, DEFAULT_CONFIG);
          const specMessages = validatePtreeDocument(doc, SPEC_CONFIG);
          
          // Spec profile should have at least as many messages as default
          // (it has all the same rules plus PT010-PT015)
          return specMessages.length >= defaultMessages.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Specific examples - profile comparison', () => {
    const testCases = [
      {
        name: 'Minimal document',
        doc: 'ROOT//\n└── file.txt',
        expectSpecErrors: true
      },
      {
        name: 'Default profile document',
        doc: '@ptree: default\nROOT//\n└── file.txt',
        expectSpecErrors: true
      },
      {
        name: 'Partial spec headers',
        doc: '@ptree: spec\n@style: unicode\nROOT//\n└── file.txt',
        expectSpecErrors: true
      }
    ];

    for (const tc of testCases) {
      const doc = parsePtreeDocument(tc.doc);
      
      const defaultMessages = validatePtreeDocument(doc, DEFAULT_CONFIG);
      const specMessages = validatePtreeDocument(doc, SPEC_CONFIG);
      
      const hasSpecErrors = hasSpecProfileErrors(specMessages);
      
      assert.strictEqual(
        hasSpecErrors,
        tc.expectSpecErrors,
        `${tc.name}: Expected spec errors=${tc.expectSpecErrors}, got=${hasSpecErrors}\n` +
        `Default messages: ${JSON.stringify(defaultMessages)}\n` +
        `Spec messages: ${JSON.stringify(specMessages)}`
      );
    }
  });
});

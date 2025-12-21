import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { parsePtreeDocument } from '../../core/parser';
import { validatePtreeDocument, LintMessage } from '../../core/validator';
import { loadProfileConfig, PtreeConfig } from '../../core/config';

/**
 * **Feature: docs-implementation-alignment, Property 4: Rule Test File Validation**
 * **Validates: Requirements 19.2**
 * 
 * For any rule test file in the playground/rules/ directory, running validation
 * should produce at least one diagnostic with the expected rule code (PT001-PT015).
 */
suite('Rule Test File Validation Property Tests', () => {

  /**
   * Get the ptree-syntax root directory (where config/ is located)
   */
  function getPtreeSyntaxRoot(): string {
    // This test file is at ptree-syntax/src/test/suite/
    // ptree-syntax root is at ../../.. from here
    return path.resolve(__dirname, '..', '..', '..');
  }

  /**
   * Load the default profile config
   */
  function getConfig(): PtreeConfig {
    return loadProfileConfig(getPtreeSyntaxRoot(), 'default');
  }

  /**
   * Extract the expected rule code from the filename.
   * e.g., "pt001-root-marker.ptree" -> "PT001"
   */
  function extractExpectedRuleCode(filename: string): string | null {
    const match = filename.match(/^(pt\d{3})/i);
    if (match) {
      return match[1].toUpperCase();
    }
    return null;
  }

  /**
   * Find all rule test files in the playground/rules/ directory
   */
  function findRuleTestFiles(): string[] {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const rulesDir = path.join(ptreeSyntaxRoot, 'playground', 'rules');
    
    if (!fs.existsSync(rulesDir)) {
      return [];
    }
    
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.ptree'))
      .map(entry => path.join(rulesDir, entry.name));
  }

  /**
   * Check if messages contain the expected rule code
   */
  function hasRuleCode(messages: LintMessage[], code: string): boolean {
    return messages.some(m => m.code === code);
  }

  test('Property 4: Rule test files exist in playground/rules/', () => {
    const ruleFiles = findRuleTestFiles();
    
    // Skip test if playground doesn't exist (e.g., in CI without full repo)
    if (ruleFiles.length === 0) {
      const ptreeSyntaxRoot = getPtreeSyntaxRoot();
      const rulesDir = path.join(ptreeSyntaxRoot, 'playground', 'rules');
      console.log('Skipping test: No rule test files found at', rulesDir);
      return;
    }
    
    // We expect at least PT001-PT009 rule test files
    assert.ok(
      ruleFiles.length >= 9,
      `Expected at least 9 rule test files, found ${ruleFiles.length}`
    );
  });

  test('Property 4: Each rule test file triggers its expected rule', () => {
    const ruleFiles = findRuleTestFiles();
    
    if (ruleFiles.length === 0) {
      console.log('Skipping test: No rule test files found');
      return;
    }
    
    const config = getConfig();
    
    // Enable PT009 for testing (it's disabled by default)
    const testConfig: PtreeConfig = {
      ...config,
      RULES: {
        ...config.RULES,
        PT009: { enabled: true, severity: 'warning' }
      }
    };
    
    const failures: { file: string; expectedCode: string; foundCodes: string[] }[] = [];
    
    for (const filePath of ruleFiles) {
      const filename = path.basename(filePath);
      const expectedCode = extractExpectedRuleCode(filename);
      
      if (!expectedCode) {
        continue; // Skip files that don't match the naming pattern
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const doc = parsePtreeDocument(content);
      const messages = validatePtreeDocument(doc, testConfig);
      
      const foundCodes = [...new Set(messages.map(m => m.code))];
      
      if (!hasRuleCode(messages, expectedCode)) {
        failures.push({ file: filename, expectedCode, foundCodes });
      }
    }
    
    if (failures.length > 0) {
      const errorMessage = failures
        .map(({ file, expectedCode, foundCodes }) => 
          `  - ${file}: Expected ${expectedCode}, found [${foundCodes.join(', ')}]`)
        .join('\n');
      
      assert.fail(`${failures.length} rule test file(s) did not trigger expected rule:\n${errorMessage}`);
    }
  });

  test('Property 4: PT001 rule test file triggers PT001', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt001-root-marker.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt001-root-marker.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    const messages = validatePtreeDocument(doc, config);
    
    assert.ok(
      hasRuleCode(messages, 'PT001'),
      `Expected PT001 error, found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: PT002 rule test file triggers PT002', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt002-dir-marker.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt002-dir-marker.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    const messages = validatePtreeDocument(doc, config);
    
    assert.ok(
      hasRuleCode(messages, 'PT002'),
      `Expected PT002 error, found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: PT003 rule test file triggers PT003', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt003-ptree-directive.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt003-ptree-directive.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    const messages = validatePtreeDocument(doc, config);
    
    assert.ok(
      hasRuleCode(messages, 'PT003'),
      `Expected PT003 warning, found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: PT004 rule test file triggers PT004', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt004-name-types.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt004-name-types.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    const messages = validatePtreeDocument(doc, config);
    
    assert.ok(
      hasRuleCode(messages, 'PT004'),
      `Expected PT004 error, found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: PT005 rule test file triggers PT005', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt005-version-delimiter.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt005-version-delimiter.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    const messages = validatePtreeDocument(doc, config);
    
    assert.ok(
      hasRuleCode(messages, 'PT005'),
      `Expected PT005 error, found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: PT006 rule test file triggers PT006', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt006-no-spaces.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt006-no-spaces.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    const messages = validatePtreeDocument(doc, config);
    
    assert.ok(
      hasRuleCode(messages, 'PT006'),
      `Expected PT006 error, found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: PT007 rule test file triggers PT007', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt007-ext-lowercase.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt007-ext-lowercase.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    const messages = validatePtreeDocument(doc, config);
    
    assert.ok(
      hasRuleCode(messages, 'PT007'),
      `Expected PT007 warning, found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: PT008 rule test file triggers PT008', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt008-mixed-delimiters.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt008-mixed-delimiters.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    const messages = validatePtreeDocument(doc, config);
    
    assert.ok(
      hasRuleCode(messages, 'PT008'),
      `Expected PT008 warning, found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: PT009 rule test file triggers PT009 when enabled', () => {
    const ptreeSyntaxRoot = getPtreeSyntaxRoot();
    const filePath = path.join(ptreeSyntaxRoot, 'playground', 'rules', 'pt009-sorting.ptree');
    
    if (!fs.existsSync(filePath)) {
      console.log('Skipping test: pt009-sorting.ptree not found');
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePtreeDocument(content);
    const config = getConfig();
    
    // PT009 is disabled by default, so we need to enable it
    const testConfig: PtreeConfig = {
      ...config,
      RULES: {
        ...config.RULES,
        PT009: { enabled: true, severity: 'warning' }
      }
    };
    
    const messages = validatePtreeDocument(doc, testConfig);
    
    assert.ok(
      hasRuleCode(messages, 'PT009'),
      `Expected PT009 warning (with PT009 enabled), found: [${messages.map(m => m.code).join(', ')}]`
    );
  });

  test('Property 4: All rule test files are parseable', () => {
    const ruleFiles = findRuleTestFiles();
    
    if (ruleFiles.length === 0) {
      console.log('Skipping test: No rule test files found');
      return;
    }
    
    const parseErrors: { file: string; errors: string[] }[] = [];
    
    for (const filePath of ruleFiles) {
      const filename = path.basename(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const doc = parsePtreeDocument(content);
      
      // Check for fatal parse errors (not validation errors)
      const fatalErrors = doc.errors.filter(e => 
        !e.message.includes('Unknown directive') // Ignore unknown directive warnings
      );
      
      if (fatalErrors.length > 0) {
        parseErrors.push({
          file: filename,
          errors: fatalErrors.map(e => e.message)
        });
      }
    }
    
    if (parseErrors.length > 0) {
      const errorMessage = parseErrors
        .map(({ file, errors }) => 
          `  - ${file}: ${errors.join('; ')}`)
        .join('\n');
      
      assert.fail(`${parseErrors.length} rule test file(s) have parse errors:\n${errorMessage}`);
    }
  });
});

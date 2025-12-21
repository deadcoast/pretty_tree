import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * **Feature: docs-implementation-alignment, Property 2: Semantic Token Documentation Completeness**
 * **Validates: Requirements 4.1**
 * 
 * For any semantic token type defined in the source code (semanticTokens.ts),
 * there should be corresponding documentation in SEMANTIC_TOKENS.md.
 */
suite('Semantic Token Documentation Completeness Property Tests', () => {

  /**
   * Get the workspace root directory (two levels up from test file location)
   */
  function getWorkspaceRoot(): string {
    // This test file is at ptree-syntax/src/test/suite/
    // Workspace root is at ../../.. from here
    return path.resolve(__dirname, '..', '..', '..', '..');
  }

  /**
   * Extract token types from the source code by parsing the TypeScript file
   */
  function extractSourceTokenTypes(): string[] {
    const workspaceRoot = getWorkspaceRoot();
    const sourcePath = path.join(workspaceRoot, 'ptree-syntax', 'src', 'semanticTokens.ts');
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file not found: ${sourcePath}`);
    }
    
    const content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Match the PTREE_SEMANTIC_TOKEN_TYPES array
    const arrayMatch = content.match(/PTREE_SEMANTIC_TOKEN_TYPES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
    if (!arrayMatch) {
      throw new Error('Could not find PTREE_SEMANTIC_TOKEN_TYPES array in source');
    }
    
    // Extract individual token names from the array
    const tokenRegex = /'(ptree[A-Za-z]+)'/g;
    const tokens: string[] = [];
    let match;
    
    while ((match = tokenRegex.exec(arrayMatch[1])) !== null) {
      tokens.push(match[1]);
    }
    
    return tokens;
  }

  /**
   * Extract base modifiers from the source code
   */
  function extractSourceBaseModifiers(): string[] {
    const workspaceRoot = getWorkspaceRoot();
    const sourcePath = path.join(workspaceRoot, 'ptree-syntax', 'src', 'semanticTokens.ts');
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file not found: ${sourcePath}`);
    }
    
    const content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Match the PTREE_BASE_TOKEN_MODIFIERS array
    const arrayMatch = content.match(/PTREE_BASE_TOKEN_MODIFIERS\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
    if (!arrayMatch) {
      throw new Error('Could not find PTREE_BASE_TOKEN_MODIFIERS array in source');
    }
    
    // Extract individual modifier names from the array
    const modifierRegex = /'([a-z_]+)'/g;
    const modifiers: string[] = [];
    let match;
    
    while ((match = modifierRegex.exec(arrayMatch[1])) !== null) {
      modifiers.push(match[1]);
    }
    
    return modifiers;
  }

  /**
   * Extract all token type names mentioned in the documentation
   */
  function extractDocumentedTokenTypes(content: string): Set<string> {
    const tokenTypes = new Set<string>();
    
    // Match backtick-quoted token names like `ptreeScaffold`
    const backtickRegex = /`(ptree[A-Za-z]+)`/g;
    let match;
    
    while ((match = backtickRegex.exec(content)) !== null) {
      tokenTypes.add(match[1]);
    }
    
    return tokenTypes;
  }

  /**
   * Extract all modifier names mentioned in the documentation
   */
  function extractDocumentedModifiers(content: string): Set<string> {
    const modifiers = new Set<string>();
    
    // Match backtick-quoted modifiers like `nt_high_type`, `mismatch`, `unknown`
    const modifierRegex = /`(nt_[a-z_]+|mismatch|unknown|nt_custom)`/g;
    let match;
    
    while ((match = modifierRegex.exec(content)) !== null) {
      modifiers.add(match[1]);
    }
    
    return modifiers;
  }

  test('Property 2: Semantic Token Documentation Completeness - all token types should be documented', () => {
    const workspaceRoot = getWorkspaceRoot();
    const docPath = path.join(workspaceRoot, 'docs', 'ptree-python', 'SEMANTIC_TOKENS.md');
    
    // Skip test if documentation file doesn't exist
    if (!fs.existsSync(docPath)) {
      console.log('Skipping test: SEMANTIC_TOKENS.md not found at', docPath);
      return;
    }
    
    const content = fs.readFileSync(docPath, 'utf-8');
    const documentedTokenTypes = extractDocumentedTokenTypes(content);
    const sourceTokenTypes = extractSourceTokenTypes();
    const undocumentedTokenTypes: string[] = [];
    
    // Check each token type defined in source code
    for (const tokenType of sourceTokenTypes) {
      if (!documentedTokenTypes.has(tokenType)) {
        undocumentedTokenTypes.push(tokenType);
      }
    }
    
    if (undocumentedTokenTypes.length > 0) {
      assert.fail(
        `Found ${undocumentedTokenTypes.length} undocumented semantic token type(s):\n` +
        undocumentedTokenTypes.map(t => `  - ${t}`).join('\n')
      );
    }
  });

  test('Property 2: Semantic Token Documentation Completeness - all base modifiers should be documented', () => {
    const workspaceRoot = getWorkspaceRoot();
    const docPath = path.join(workspaceRoot, 'docs', 'ptree-python', 'SEMANTIC_TOKENS.md');
    
    // Skip test if documentation file doesn't exist
    if (!fs.existsSync(docPath)) {
      console.log('Skipping test: SEMANTIC_TOKENS.md not found at', docPath);
      return;
    }
    
    const content = fs.readFileSync(docPath, 'utf-8');
    const documentedModifiers = extractDocumentedModifiers(content);
    const sourceBaseModifiers = extractSourceBaseModifiers();
    const undocumentedModifiers: string[] = [];
    
    // Check each base modifier defined in source code
    for (const modifier of sourceBaseModifiers) {
      if (!documentedModifiers.has(modifier)) {
        undocumentedModifiers.push(modifier);
      }
    }
    
    if (undocumentedModifiers.length > 0) {
      assert.fail(
        `Found ${undocumentedModifiers.length} undocumented base modifier(s):\n` +
        undocumentedModifiers.map(m => `  - ${m}`).join('\n')
      );
    }
  });

  test('Property 2: Semantic Token Documentation Completeness - documentation should list exactly 19 token types', () => {
    const workspaceRoot = getWorkspaceRoot();
    const docPath = path.join(workspaceRoot, 'docs', 'ptree-python', 'SEMANTIC_TOKENS.md');
    
    // Skip test if documentation file doesn't exist
    if (!fs.existsSync(docPath)) {
      console.log('Skipping test: SEMANTIC_TOKENS.md not found at', docPath);
      return;
    }
    
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Check that the documentation mentions "19 token types"
    assert.ok(
      content.includes('19 token types'),
      'Documentation should mention "19 token types" in the Token types section'
    );
    
    // Verify source code also has 19 token types
    const sourceTokenTypes = extractSourceTokenTypes();
    assert.strictEqual(
      sourceTokenTypes.length,
      19,
      `Expected 19 token types in source code, found ${sourceTokenTypes.length}`
    );
  });

  test('Property 2: Semantic Token Documentation Completeness - new attribute tokens should be documented', () => {
    const workspaceRoot = getWorkspaceRoot();
    const docPath = path.join(workspaceRoot, 'docs', 'ptree-python', 'SEMANTIC_TOKENS.md');
    
    // Skip test if documentation file doesn't exist
    if (!fs.existsSync(docPath)) {
      console.log('Skipping test: SEMANTIC_TOKENS.md not found at', docPath);
      return;
    }
    
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // These are the new tokens that were added and must be documented
    const requiredNewTokens = [
      'ptreeAttribute',
      'ptreeAttributeKey',
      'ptreeAttributeValue',
      'ptreeInlineComment'
    ];
    
    const missingTokens: string[] = [];
    
    for (const token of requiredNewTokens) {
      if (!content.includes(`\`${token}\``)) {
        missingTokens.push(token);
      }
    }
    
    if (missingTokens.length > 0) {
      assert.fail(
        `Missing documentation for new attribute/comment tokens:\n` +
        missingTokens.map(t => `  - ${t}`).join('\n')
      );
    }
  });

  test('Property 2: Semantic Token Documentation Completeness - nt_index_type and nt_numeral modifiers should be documented', () => {
    const workspaceRoot = getWorkspaceRoot();
    const docPath = path.join(workspaceRoot, 'docs', 'ptree-python', 'SEMANTIC_TOKENS.md');
    
    // Skip test if documentation file doesn't exist
    if (!fs.existsSync(docPath)) {
      console.log('Skipping test: SEMANTIC_TOKENS.md not found at', docPath);
      return;
    }
    
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Check for nt_index_type modifier documentation
    assert.ok(
      content.includes('`nt_index_type`'),
      'Documentation should include nt_index_type modifier'
    );
    
    // Check for nt_numeral modifier documentation
    assert.ok(
      content.includes('`nt_numeral`'),
      'Documentation should include nt_numeral modifier'
    );
  });

  test('Property 2: Semantic Token Documentation Completeness - theme customization examples for new tokens', () => {
    const workspaceRoot = getWorkspaceRoot();
    const docPath = path.join(workspaceRoot, 'docs', 'ptree-python', 'SEMANTIC_TOKENS.md');
    
    // Skip test if documentation file doesn't exist
    if (!fs.existsSync(docPath)) {
      console.log('Skipping test: SEMANTIC_TOKENS.md not found at', docPath);
      return;
    }
    
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Check that theme customization section includes new tokens
    const newTokensInThemeSection = [
      '"ptreeAttribute"',
      '"ptreeAttributeKey"',
      '"ptreeAttributeValue"',
      '"ptreeInlineComment"'
    ];
    
    const missingThemeExamples: string[] = [];
    
    for (const token of newTokensInThemeSection) {
      if (!content.includes(token)) {
        missingThemeExamples.push(token);
      }
    }
    
    if (missingThemeExamples.length > 0) {
      assert.fail(
        `Missing theme customization examples for new tokens:\n` +
        missingThemeExamples.map(t => `  - ${t}`).join('\n')
      );
    }
  });
});

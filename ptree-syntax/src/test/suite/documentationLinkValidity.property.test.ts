import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * **Feature: docs-implementation-alignment, Property 1: Documentation Link Validity**
 * **Validates: Requirements 1.3**
 * 
 * For any markdown file in the docs/ directory, all internal links (relative paths)
 * should point to files that exist in the repository.
 */
suite('Documentation Link Validity Property Tests', () => {

  /**
   * Recursively find all markdown files in a directory
   */
  function findMarkdownFiles(dir: string): string[] {
    const results: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return results;
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
    
    return results;
  }

  /**
   * Extract all internal links from markdown content.
   * Matches [text](path) patterns where path is a relative path (not http/https/mailto).
   */
  function extractInternalLinks(content: string): string[] {
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    const links: string[] = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[2];
      
      // Skip external links (http, https, mailto, etc.)
      if (linkPath.startsWith('http://') || 
          linkPath.startsWith('https://') || 
          linkPath.startsWith('mailto:') ||
          linkPath.startsWith('#')) {
        continue;
      }
      
      // Remove anchor fragments from the path
      const pathWithoutAnchor = linkPath.split('#')[0];
      
      if (pathWithoutAnchor) {
        links.push(pathWithoutAnchor);
      }
    }
    
    return links;
  }

  /**
   * Get the workspace root directory (two levels up from test file location)
   */
  function getWorkspaceRoot(): string {
    // This test file is at ptree-syntax/src/test/suite/
    // Workspace root is at ../../.. from here
    return path.resolve(__dirname, '..', '..', '..', '..');
  }

  test('Property 1: Documentation Link Validity - all internal links in docs/ should resolve', () => {
    const workspaceRoot = getWorkspaceRoot();
    const docsDir = path.join(workspaceRoot, 'docs');
    
    // Skip test if docs directory doesn't exist (e.g., in CI without full repo)
    if (!fs.existsSync(docsDir)) {
      console.log('Skipping test: docs/ directory not found at', docsDir);
      return;
    }
    
    const markdownFiles = findMarkdownFiles(docsDir);
    const brokenLinks: { file: string; link: string; resolvedPath: string }[] = [];
    
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const links = extractInternalLinks(content);
      const fileDir = path.dirname(file);
      
      for (const link of links) {
        const resolvedPath = path.resolve(fileDir, link);
        
        if (!fs.existsSync(resolvedPath)) {
          brokenLinks.push({ file, link, resolvedPath });
        }
      }
    }
    
    if (brokenLinks.length > 0) {
      const errorMessage = brokenLinks
        .map(({ file, link, resolvedPath }) => 
          `  - ${path.relative(workspaceRoot, file)}: "${link}" -> ${path.relative(workspaceRoot, resolvedPath)}`)
        .join('\n');
      
      assert.fail(`Found ${brokenLinks.length} broken internal link(s):\n${errorMessage}`);
    }
  });

  test('Property 1: Documentation Link Validity - ptree-spec README links should all resolve', () => {
    const workspaceRoot = getWorkspaceRoot();
    const readmePath = path.join(workspaceRoot, 'docs', 'ptree-spec', 'README.md');
    
    // Skip test if file doesn't exist
    if (!fs.existsSync(readmePath)) {
      console.log('Skipping test: README.md not found at', readmePath);
      return;
    }
    
    const content = fs.readFileSync(readmePath, 'utf-8');
    const links = extractInternalLinks(content);
    const fileDir = path.dirname(readmePath);
    const brokenLinks: { link: string; resolvedPath: string }[] = [];
    
    for (const link of links) {
      const resolvedPath = path.resolve(fileDir, link);
      
      if (!fs.existsSync(resolvedPath)) {
        brokenLinks.push({ link, resolvedPath });
      }
    }
    
    if (brokenLinks.length > 0) {
      const errorMessage = brokenLinks
        .map(({ link, resolvedPath }) => 
          `  - "${link}" -> ${path.relative(workspaceRoot, resolvedPath)}`)
        .join('\n');
      
      assert.fail(`Found ${brokenLinks.length} broken link(s) in ptree-spec/README.md:\n${errorMessage}`);
    }
    
    // Verify we found the expected number of spec document links (15 spec docs + 1 ptree-syntax link)
    const specDocLinks = links.filter(link => link.match(/^\d{2}_.*\.md$/));
    assert.ok(
      specDocLinks.length >= 15,
      `Expected at least 15 spec document links, found ${specDocLinks.length}`
    );
  });

  test('Property 1: Documentation Link Validity - no ptree-training references should exist', () => {
    const workspaceRoot = getWorkspaceRoot();
    const docsDir = path.join(workspaceRoot, 'docs');
    
    // Skip test if docs directory doesn't exist
    if (!fs.existsSync(docsDir)) {
      console.log('Skipping test: docs/ directory not found at', docsDir);
      return;
    }
    
    const markdownFiles = findMarkdownFiles(docsDir);
    const badReferences: { file: string; line: number; content: string }[] = [];
    
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('ptree-training/')) {
          badReferences.push({
            file,
            line: i + 1,
            content: lines[i].trim()
          });
        }
      }
    }
    
    if (badReferences.length > 0) {
      const errorMessage = badReferences
        .map(({ file, line, content }) => 
          `  - ${path.relative(workspaceRoot, file)}:${line}: ${content}`)
        .join('\n');
      
      assert.fail(`Found ${badReferences.length} reference(s) to non-existent "ptree-training/" path:\n${errorMessage}`);
    }
  });
});

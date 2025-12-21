# Contributing to ptree

Thank you for your interest in contributing to ptree! This document provides guidelines for contributing to the project.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- VS Code (for extension development)
- Git

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/ptree.git
   cd ptree/ptree-syntax
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run compile
   ```

4. Run tests:
   ```bash
   npm run test:unit
   ```

---

## Development Workflow

### Building

```bash
# One-time build
npm run compile

# Watch mode (rebuilds on changes)
npm run watch
```

### Testing

```bash
# Run unit tests (Mocha)
npm run test:unit

# Run VS Code extension tests
npm run test

# Run linting
npm run lint
```

### Debugging the Extension

1. Open `ptree-syntax/` folder in VS Code
2. Press **F5** to launch Extension Development Host
3. Open a `.ptree` file to test highlighting and validation

### CLI Development

After building, test the CLI:

```bash
# Generate a tree
node bin/ptree.js gen . --style unicode --max-depth 3

# Validate a file
node bin/ptree.js validate samples/example.ptree

# Fix issues
node bin/ptree.js validate samples/example.ptree --fix --write
```

---

## Project Structure

```
ptree-syntax/
├── src/
│   ├── core/           # Core logic (parser, validator, fixer, config)
│   │   ├── parser.ts   # AST parser
│   │   ├── validator.ts # Lint rules
│   │   ├── fixer.ts    # Auto-fix logic
│   │   └── config.ts   # Configuration loading
│   ├── extension.ts    # VS Code extension entry
│   ├── cli.ts          # CLI entry point
│   ├── semanticTokens.ts # Semantic highlighting
│   └── test/suite/     # Test files
├── config/             # Built-in profiles and schema
├── syntaxes/           # TextMate grammar
├── docs/               # Documentation
└── samples/            # Example ptree files
```

---

## Coding Standards

### TypeScript Style

- Use 2-space indentation
- Use semicolons
- Use `camelCase` for variables and functions
- Use `PascalCase` for types and classes
- Use `SCREAMING_SNAKE_CASE` for constants

### File Naming

- Use `camelCase` for TypeScript files: `semanticTokens.ts`
- Use `kebab-case` for config files: `ptree.default-config.json`
- Test files: `*.test.ts` or `*.property.test.ts`

### Code Organization

- Keep functions small and focused
- Export types from the module where they're defined
- Use explicit return types for public functions
- Add JSDoc comments for public APIs

### Example

```typescript
/**
 * Parses a Roman numeral prefix from a directory name.
 * @param name - The directory name to parse
 * @returns Object with numeral and remainder, or null numeral if not found
 */
export function parseNumeralPrefix(name: string): { numeral: string | null; remainder: string } {
  const match = name.match(/^([IVXLCDM]+)_(.+)$/);
  if (match) {
    return { numeral: match[1], remainder: match[2] };
  }
  return { numeral: null, remainder: name };
}
```

---

## Testing Guidelines

### Unit Tests

- Place tests in `src/test/suite/`
- Name test files `*.test.ts`
- Use descriptive test names

```typescript
describe('parseNumeralPrefix', () => {
  it('should extract Roman numeral from directory name', () => {
    const result = parseNumeralPrefix('II_Getting_Started');
    assert.strictEqual(result.numeral, 'II');
    assert.strictEqual(result.remainder, 'Getting_Started');
  });
});
```

### Property-Based Tests

- Name files `*.property.test.ts`
- Use `fast-check` for property testing
- Tag tests with feature and property number

```typescript
import * as fc from 'fast-check';

describe('Parser Round-Trip', () => {
  it('**Feature: ptree-completion, Property 1: Parser Round-Trip Consistency**', () => {
    fc.assert(
      fc.property(validPtreeArbitrary(), (doc) => {
        const text = printPtreeDocument(doc);
        const reparsed = parsePtreeDocument(text);
        return isEquivalentAST(doc, reparsed);
      }),
      { numRuns: 100 }
    );
  });
});
```

---

## Adding New Features

### Adding a New NAME_TYPE

1. Add definition to `config/ptree.default-config.json`:
   ```json
   "NEW_TYPE": {
     "description": "Description of the naming convention",
     "word_delimiter": "-",
     "allowed_version_delimiters": ["_"],
     "pattern": "^[a-z]+$",
     "examples": ["example", "another"],
     "with_number_examples": ["example_1.0.0"]
   }
   ```

2. Add to `ENTITY_NAME_TYPES` if it should be allowed for specific entities

3. Update `config/ptreeconfig.schema.json` if needed

4. Add documentation to `docs/GRAMMAR.md`

5. Add tests

### Adding a New Lint Rule

1. Add rule definition to `config/ptree.default-config.json`:
   ```json
   "PT016": {
     "description": "Description of what the rule checks",
     "enabled": true,
     "severity": "warning"
   }
   ```

2. Implement validation in `src/core/validator.ts`

3. Add fixer in `src/core/fixer.ts` if auto-fixable

4. Update `config/ptreeconfig.schema.json`

5. Document in `docs/GRAMMAR.md`

6. Add tests

### Adding a New Semantic Token

1. Add token type to `PTREE_SEMANTIC_TOKEN_TYPES` in `src/semanticTokens.ts`

2. Implement tokenization logic in `tokenizeNodeLine` or `tokenizeRootLine`

3. Update `docs/SEMANTIC_TOKENS.md`

4. Add tests

---

## Pull Request Guidelines

### Before Submitting

1. Run all tests: `npm run test:unit`
2. Run linting: `npm run lint`
3. Build successfully: `npm run compile`
4. Update documentation if needed
5. Add tests for new functionality

### PR Description

Include:
- Summary of changes
- Motivation/rationale
- Testing notes
- Screenshots for UI changes

### Commit Messages

Use sentence-style summaries:
- ✅ `Add NUMERAL NAME_TYPE for Roman numeral prefixes`
- ✅ `Fix PT009 sorting for mixed-case names`
- ❌ `fixed bug`
- ❌ `WIP`

---

## Reporting Issues

### Bug Reports

Include:
- ptree version (`node bin/ptree.js --version`)
- VS Code version (if extension-related)
- Steps to reproduce
- Expected vs actual behavior
- Sample `.ptree` file if applicable

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered

---

## Questions?

- Open a GitHub issue for questions
- Check existing issues and documentation first
- Tag issues appropriately (`bug`, `enhancement`, `question`)

---

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

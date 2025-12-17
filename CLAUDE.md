# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ptree is a VS Code extension and CLI toolkit for a standardized, human-friendly directory tree format (`.ptree`). The format is designed for visual parsing, documentation copy/paste, and editor ergonomics. It supports syntax highlighting, smart folding, validation rules (markdownlint-style), and semantic token highlighting driven by configurable NAME_TYPES.

## Build Commands

```bash
cd 0.0.4
npm install
npm run compile     # Compiles TypeScript to ./out
npm run watch       # Watch mode for development
```

To test the VS Code extension, press **F5** in VS Code to launch an Extension Development Host.

## CLI Usage

After compiling:

```bash
# Generate a ptree from filesystem (default profile)
node bin/ptree.js gen . --style unicode --max-depth 5

# Generate with canonical spec profile
node bin/ptree.js gen . --profile spec --version 0.0.2

# Validate a ptree file (auto-detects profile from @ptree directive)
node bin/ptree.js validate samples/example.ptree

# Fix and write changes in-place
node bin/ptree.js validate samples/example.ptree --fix --write
```

## Architecture

The extension lives entirely in `0.0.4/`. Key components:

### Core Modules (`src/core/`)

- **parser.ts**: Parses `.ptree` text into `PtreeDocument` AST with directives, root, nodes, and errors. Handles multi-line bracket block directives (e.g., `@name_type:[...]`).

- **config.ts**: Loads and merges configuration from built-in profiles (`config/ptree.default-config.json`, `config/ptree.spec-config.json`) with optional workspace config (`.ptreerc.json`, `.ptree.json`, or `ptree.config.json`).

- **validator.ts**: Implements lint rules (PT001-PT015). Rules are markdownlint-style: each has an ID, can be enabled/disabled, and has configurable severity. The spec profile enforces stricter canonical header requirements.

- **fixer.ts**: Applies safe mechanical fixes (e.g., adding missing `/` to directories).

### Extension Entry (`src/extension.ts`)

Registers:
- `FoldingRangeProvider` that understands tree depth (not plain indentation)
- `SemanticTokensProvider` for dynamic NAME_TYPES-aware highlighting
- Diagnostic collection for real-time validation
- Commands: `ptree.copyPathAtCursor`, `ptree.copyRelativePathAtCursor`, `ptree.validateDocument`, `ptree.fixDocument`

### Semantic Tokens (`src/semanticTokens.ts`)

The semantic tokens layer reads config and classifies names against `NAME_TYPES` regex patterns, emitting modifiers like `nt_high_type`, `nt_smol_type`, `mismatch`.

### CLI (`src/cli.ts`)

Standalone CLI with `gen` and `validate` subcommands. Shares core modules with the extension.

## Key Concepts

### NAME_TYPES Registry

Central to ptree's validation and highlighting. Each name type (e.g., `SCREAM_TYPE`, `High_Type`, `smol-type`) defines:
- A regex pattern for matching bare names
- A word delimiter used inside names (`-`, `_`, or none)
- Allowed version delimiters (for appending semver)

### Profiles

- **default**: Flexible, friendly defaults
- **spec**: Canonical/opinionated ruleset requiring specific header directives (`@ptree: spec`, `@style: unicode`, `@version`, `@name_type`, `@seperation_delimiters`)

Profile is auto-detected from `@ptree:` directive value or can be forced via CLI `--profile`.

### Tree Format

Unicode style (default):
```
├── name
└── name
│   └── nested
```

ASCII fallback:
```
|-- name
`-- name
|   `-- nested
```

Directories end with `/`, root labels end with `//`.

## Configuration Files

- `config/ptree.default-config.json` - Default profile rules and NAME_TYPES
- `config/ptree.spec-config.json` - Spec profile (canonical) configuration
- `config/ptreeconfig.schema.json` - JSON Schema for user config files
- `syntaxes/ptree.tmLanguage.json` - TextMate grammar for static highlighting
- `language-configuration.json` - VS Code language configuration

## Documentation

- `docs/SPEC.md` - Format specification
- `docs/GRAMMAR.md` - Naming grammar and lint rules documentation
- `docs/SEMANTIC_TOKENS.md` - Semantic tokens customization guide

# Changelog

All notable changes to the `ptree` extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2024-12-17

### Added

- **Document Formatter**: Canonical formatting for ptree files
  - Sorts siblings (directories first, then files, alphabetically)
  - Ensures consistent tree characters (unicode/ascii)
  - Ensures directories end with `/`, root labels end with `//`
  - Lowercases file extensions
  - In spec mode: generates canonical header blocks
  - Accessible via `Format Document` (Shift+Alt+F) or `ptree: Format Document`
- **Semantic Tokens Provider**: Dynamic highlighting driven by `NAME_TYPES` config
  - Emits modifiers like `nt_high_type`, `nt_smol_type`, `nt_scream_type`
  - `mismatch` modifier when names violate allowed types
  - Auto-refreshes when config files change
- **Canonical "spec" profile**: Opinionated ruleset for standardized trees
  - Auto-selects from `@ptree: spec` directive
  - Enforces specific header blocks and naming conventions
- **Multi-line directive blocks**: Support for `@name_type:[...]` syntax
- **Code Actions / Quick Fixes**:
  - PT002: Add trailing `/` to directories
  - PT004: Rename to match allowed NAME_TYPE
  - PT006: Replace spaces with `-` or `_`
  - PT007: Lowercase file extension
  - PT008: Normalize mixed delimiters
- **Command**: `ptree: Apply Canonical Fixes` (`ptree.fixDocument`)
- **CLI enhancements**:
  - `--profile spec|default` flag
  - `--version` flag for spec header generation
  - `--fix` and `--write` flags for auto-fixing
- **Test infrastructure**:
  - Unit tests for parser (11 tests) and validator (10 tests)
  - VS Code integration test runner
  - ESLint configuration for TypeScript
  - `.vscodeignore` for clean extension packaging

### Changed

- `FILE_EXTENSION_SPLIT` config option: `firstDot` (spec) vs `lastDot` (default)
- Updated TextMate grammar for directive blocks and semver highlighting

## [0.0.3] - 2024-12-16

### Added

- **Validation pipeline**: markdownlint-style rules (PT001-PT009)
- **CLI**: `ptree gen` and `ptree validate` commands
- **Central NAME_TYPES registry**: Single source of truth for naming patterns
- **Config file support**: `.ptreerc.json`, `.ptree.json`, `ptree.config.json`
- **JSON Schema**: IntelliSense for config files

### Changed

- Sanitized sample files (removed real project names)
- Updated grammar definitions with explicit patterns

## [0.0.2] - 2024-12-15

### Added

- **Opinionated grammar framework**: NAME_TYPES, ENTITY_NAME_TYPES, RULES
- **SEPERATION_DELIMITERS**: `-`, `_`, `.` with usage rules
- **Universal rules**: UniRule_1 through UniRule_6

### Changed

- Root labels now use `//` suffix (visually distinct from directories)
- Directory nodes require trailing `/`

## [0.0.1] - 2024-12-14

### Added

- Initial release
- TextMate grammar for `.ptree` files
- Smart folding provider (tree-depth aware, not indentation-based)
- Commands: `ptree.copyPathAtCursor`, `ptree.copyRelativePathAtCursor`
- Markdown fenced code block support (```ptree)

---

## Rule Reference

| Code  | Description                                           | Severity |
|-------|-------------------------------------------------------|----------|
| PT001 | Root label must end with `//`                         | error    |
| PT002 | Parent nodes must end with `/`                        | error    |
| PT003 | Require `@ptree` directive                            | warning  |
| PT004 | Enforce allowed NAME_TYPES by entity                  | error    |
| PT005 | Version delimiter must differ from word delimiter     | error    |
| PT006 | No spaces in node names                               | error    |
| PT007 | File extensions should be lowercase                   | warning  |
| PT008 | Do not mix `-` and `_` in same name                   | warning  |
| PT009 | Sibling ordering (dirs first, then files, alpha)      | warning  |
| PT010 | (spec) `@ptree` must equal "spec"                     | error    |
| PT011 | (spec) `@style` must equal "unicode"                  | error    |
| PT012 | (spec) `@version` must be SEMVER                      | error    |
| PT013 | (spec) `@name_type` block required                    | error    |
| PT014 | (spec) `@seperation_delimiters` list required         | error    |
| PT015 | (spec) Root label must be `PTREE-<@version>//`        | error    |

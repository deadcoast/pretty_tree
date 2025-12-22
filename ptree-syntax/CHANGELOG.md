# Changelog

All notable changes to the `ptree` extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Note: 0.0.5 is the current draft. Wording and docs may evolve while the feature set stabilizes.

## [0.0.5] - Unreleased

### Added

- `ptree-syntax/PLAN.md` to hold roadmap and planning notes outside the changelog.

#### Playground Environment

A comprehensive testing playground at `ptree-syntax/playground/` for learning and experimenting with ptree features:

- **demos/**: 8 feature demonstration files
  - `01-basic-tree.ptree` - Basic tree structure with scaffold characters
  - `02-name-types.ptree` - NAME_TYPE validation for ROOT, DIR, FILE
  - `03-roman-numerals.ptree` - NUMERAL prefix patterns (I_, II_, III_)
  - `04-index-files.ptree` - (index) prefix convention
  - `05-symlinks.ptree` - Symlink syntax with ` -> ` arrows
  - `06-inline-metadata.ptree` - Bracket attributes and inline comments
  - `07-summary-lines.ptree` - Summary line format
  - `08-all-features.ptree` - Comprehensive demo of all features
- **profiles/**: Profile comparison files
  - `default-profile.ptree` - Default profile example
  - `spec-profile.ptree` - Spec profile with canonical headers
  - `README.md` - Profile differences documentation
- **rules/**: Rule test files (PT001-PT009)
  - Files that intentionally trigger each validation rule
  - Inline comments explaining rule behavior
- **config/**: Configuration testing
  - `.ptreerc.json` - Example user configuration
  - `strict-config.ptree` and `relaxed-config.ptree` - Config examples
- **themes/**: Theme testing
  - `all-tokens.ptree` - File exercising all 19 semantic token types
- **scripts/**: CLI test scripts
  - `test-validate.sh`, `test-gen.sh`, `test-fix.sh`, `test-diff.sh`
- `QUICKSTART.md` - Step-by-step guide for testing features
- `README.md` - Playground overview and feature list

#### Property-Based Testing

4 new property-based tests using fast-check:

- **Property 1: Documentation Link Validity** - Validates all internal links in docs/ point to existing files
- **Property 2: Semantic Token Documentation Completeness** - Ensures all token types in source code are documented
- **Property 3: Profile Validation Difference** - Verifies spec profile produces additional errors for missing headers
- **Property 4: Rule Test File Validation** - Confirms rule test files trigger expected diagnostics

#### Documentation Alignment

- Fixed 15 broken links in `docs/ptree-spec/README.md` (changed `ptree-training/` to correct relative paths)
- Updated canonical header examples in `docs/ptree-spec/00_PTREE.md` and `docs/ptree-python/SPEC.md`
  - Added EXT, META, NUMERAL entity mappings
  - Fixed spelling: `separation_delimiters` (was `seperation_delimiters`)
- Documented all six entity types: ROOT, DIR, FILE, EXT, META, NUMERAL
- Complete UniRule documentation (UniRule_1 through UniRule_6) in `docs/ptree-python/GRAMMAR.md`
  - Rule IDs PT001-PT015 with correct/incorrect examples
- Updated `docs/ptree-python/SPEC.md`:
  - Symlink syntax documentation (` -> ` arrow)
  - Inline metadata syntax (`[key=value]`, `# comment`)
  - Summary line format (`N directories, M files`)
- Error handling documentation with all rule IDs PT000-PT015

#### Semantic Token Documentation

Updated `docs/ptree-python/SEMANTIC_TOKENS.md` with all 19 token types:

- Core tokens: ptreeScaffold, ptreeDirective, ptreeDirectiveValue, ptreeRoot, ptreeDir, ptreeFile, ptreeExtension, ptreeMeta, ptreeSemver
- NAME_TYPE tokens: ptreeNameType, ptreeNumeral, ptreeIndex
- Symlink tokens: ptreeSymlink, ptreeSymlinkArrow, ptreeSymlinkTarget
- Metadata tokens: ptreeAttribute, ptreeAttributeKey, ptreeAttributeValue, ptreeInlineComment
- Documented modifiers: nt_index_type, nt_numeral, mismatch
- Theme customization examples for all token types

### Changed

- Repository extension folder renamed to `ptree-syntax/` for a stable, non-versioned path.
- Changelog now tracks releases only; roadmap content moved to `ptree-syntax/PLAN.md`.
- Bumped extension and Python wrapper versions to 0.0.5.
- Updated docs and scripts to reference `ptree-syntax/` paths.
- Updated `ptree-syntax/.vscode/launch.json` with "Run Extension with Playground" configuration
- Updated sample files with comprehensive feature demonstrations

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
- **SEPARATION_DELIMITERS**: `-`, `_`, `.` with usage rules
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
- Fenced code block support (```ptree) in Markdown docs

# Changelog

All notable changes to the `ptree` extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Note: 0.0.4 is the current draft. Wording and docs may evolve while the feature set stabilizes.

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

## [0.0.4] Roadmap Checklist

### Documentation
- [x] Draft a short message map (purpose, non-goals, user value) to reuse across all docs.
- [x] Update README.md to foreground the "no syntax highlighting for trees" problem and the minimal ptree solution.
- [x] Update 0.0.4/README.md to prioritize syntax highlighting, simplify feature text, and add a quick start.
- [x] Tighten SPEC.md with a brief "Design Goals" section and clearer MUST/SHOULD wording.
- [x] Develop GRAMMAR.md with a "Default vs spec profile" summary and current 0.0.4 examples.
- [x] Shorten SEMANTIC_TOKENS.md to benefits + minimal customization guidance.
- [x] Adjust 0.0.4/CHANGELOG.md wording if needed to match the "draft" positioning.

### Implementation (from PLAN.md)
- [x] Set independent spec versioning rules: `@ptree: spec` + `@version: <SEMVER>`
- [x] Canonical `@separation_delimiters` spelling with legacy `@seperation_delimiters` alias
- [x] Parser/formatter/fixer preserve inline metadata, comments, and symlink targets
- [x] Consolidated parsing logic (all components use `parsePtreeDocument`)
- [x] Validator parity with GRAMMAR.md (PT001-PT015, FILE_EXTENSION_SPLIT)
- [x] Python CLI wrapper (`main.py`, `pyproject.toml`)
- [x] Unit tests for parser (12), validator (10), fixer (2)

## [0.0.4] Roadmap Plan Tasklist

Align ptree around independent spec semver (separate from extension version), fix delimiter spelling with backward compatibility, and introduce a Python CLI wrapper while tightening formatter/validator parity with the docs.

## Requirements

- Spec version is independent semver via `@version` (extension/CLI version stays separate).
- `@separation_delimiters` is canonical; `@seperation_delimiters` remains a legacy alias with clear precedence.
- Formatter/fixer must preserve inline metadata, comments, and symlink targets.
- Validation and highlighting should match GRAMMAR/SPEC behavior.
- Python package is a thin CLI wrapper for the Node CLI.
- Lead with the primary purpose: syntax highlighting for directory trees and readable Markdown code blocks.
- Emphasize "simple to operate" defaults with optional advanced rules, without adding user burden.
- Keep claims strictly aligned to current 0.0.4 capabilities (extension + CLI).
- Standardize terminology across docs (profiles, directives, NAME_TYPES, spec vs default).
- Provide a short, clear "why/what/how" path for first-time users.

## Scope

- In: parser/validator/formatter/fixer, CLI UX, config/schema, docs/examples, tests, Python wrapper.
- In: copy edits, structure changes, examples, and cross-references in the listed docs.
- Out: new editor integrations or syntax redesign.
- Out: code changes, new features, or behavior changes to the spec/grammar.

## Files and entry points

- `0.0.4/src/core/parser.ts`
- `0.0.4/src/core/validator.ts`
- `0.0.4/src/formatter.ts`
- `0.0.4/src/cli.ts`
- `0.0.4/syntaxes/ptree.tmLanguage.json`
- `0.0.4/config/ptreeconfig.schema.json`
- `0.0.4/docs/SPEC.md`
- `0.0.4/docs/GRAMMAR.md`
- `0.0.4/docs/SEMANTIC_TOKENS.md`
- `0.0.4/CHANGELOG.md`
- `0.0.4/README.md`
- `0.0.4/samples/example.ptree`
- `pyproject.toml`
- `main.py`
- `README.md`


## Data model / API changes

- Extend AST to retain inline metadata/comments/symlink targets.
- Prefer `separation_delimiters` in output; accept `seperation_delimiters` as legacy alias.
- Add Python CLI entrypoint that proxies to compiled Node CLI.

## Action items

[x] Set independent spec versioning rules: `@ptree: spec` + `@version: <SEMVER>`; default spec version to `1.0.0`.
[x] Update docs/examples to use `@version: 1.0.0` and `@separation_delimiters`, with a deprecation note for the legacy spelling.
[x] Update CLI `gen --profile spec` to emit `@separation_delimiters` and default spec `@version` to `1.0.0`.
[x] Update schema/config to include `SEPARATION_DELIMITERS` and preserve legacy `SEPERATION_DELIMITERS`; define precedence rules.
[x] Extend parser/formatter/fixer to preserve inline metadata/comments/symlink targets during formatting and fixes.
[x] Consolidate parsing logic used by folding/path-copy into shared helpers or core parser output.
[x] Tighten validator parity with GRAMMAR (extension rules, dotted-name constraints, directive validation).
[x] Implement Python CLI wrapper (console script) that forwards args to Node CLI and reports missing Node/compiled artifacts clearly.
[x] Add unit tests for formatter/fixer/CLI and regression fixtures for metadata/symlinks/spec headers.

## Testing and validation

- `cd 0.0.4 && npm run lint`
- `cd 0.0.4 && npm run test:unit`
- `cd 0.0.4 && npm run test`
- CLI smoke: `cd 0.0.4 && npm run ptree -- gen . --max-depth 2` and `npm run ptree -- validate samples/example.ptree`
- Python wrapper smoke: `python -m ptree --help` (or console script)
- Verify all examples match current spec/grammar rules and the 0.0.4 behavior.
- Check all cross-doc references and section titles for consistency.
- Scan for any promises that exceed the current implementation.

## Risks and edge cases

- Dual spelling could create ambiguous configs without explicit precedence rules.
- Formatter changes could drop metadata if AST changes are incomplete.
- Python wrapper depends on Node and compiled JS; needs clear error guidance.
- Over-promising standardization or Markdown adoption; keep statements framed as goals.
- "Simple UX" messaging could conflict with detailed spec text; add a clear default path.

Using the plan skill to outline doc updates that align the 0.0.4 draft with the "turn key, simple, high-quality UX" vision while keeping the spec airtight for Markdown adoption.

## Message map (draft)

- Purpose: syntax-first directory tree language with clear highlighting and stable structure.
- Non-goals: not a filesystem CLI replacement; not a general-purpose markup language; no required config.
- User value: readable trees in editors/docs, fast scanning, optional validation when desired.
- Positioning: Markdown is a common host, not the goal.

---

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
| PT014 | (spec) `@separation_delimiters` list required         | error    |
| PT015 | (spec) Root label must be `PTREE-<@version>//`        | error    |

# Roadmap

This file tracks roadmap checklists and planning notes that do not belong in the changelog.

## 0.0.5 Roadmap Checklist (draft)

### Documentation

- [x] Update README.md and ptree-syntax/README.md for the `ptree-syntax/` folder rename and 0.0.5 status.
- [ ] Refresh ptree-syntax/docs/SPEC.md, ptree-syntax/docs/GRAMMAR.md, and ptree-syntax/docs/SEMANTIC_TOKENS.md for 0.0.5 terminology and examples.
- [x] Update ptree-syntax/CHANGELOG.md with real 0.0.5 entries as work ships.

### Implementation

- [x] Update main.py and install.sh to target `ptree-syntax/` paths.
- [x] Update any remaining `0.0.4/` or `ptree-0.0.4/` references in configs and docs.
- [x] Align package versions to 0.0.5 where applicable.

### Testing and validation

- [ ] Run `cd ptree-syntax && npm run lint`.
- [ ] Run `cd ptree-syntax && npm run test:unit`.
- [ ] Run `cd ptree-syntax && npm run test`.
- [ ] Run `python -m ptree --help` after updating wrapper paths.

## 0.0.4 Roadmap Checklist (completed)

### Documentation

- [x] Draft a short message map (purpose, non-goals, user value) to reuse across all docs.
- [x] Update README.md to foreground the "no syntax highlighting for trees" problem and the minimal ptree solution.
- [x] Update ptree-syntax/README.md to prioritize syntax highlighting, simplify feature text, and add a quick start.
- [x] Tighten docs/SPEC.md with a brief "Design Goals" section and clearer MUST/SHOULD wording.
- [x] Develop docs/GRAMMAR.md with a "Default vs spec profile" summary and current 0.0.4 examples.
- [x] Shorten docs/SEMANTIC_TOKENS.md to benefits + minimal customization guidance.
- [x] Adjust ptree-syntax/CHANGELOG.md wording if needed to match the "draft" positioning.

### Implementation (from PLAN.md)

- [x] Set independent spec versioning rules: `@ptree: spec` + `@version: <SEMVER>`
- [x] Canonical `@separation_delimiters` spelling with legacy `@seperation_delimiters` alias
- [x] Parser/formatter/fixer preserve inline metadata, comments, and symlink targets
- [x] Consolidated parsing logic (all components use `parsePtreeDocument`)
- [x] Validator parity with GRAMMAR.md (PT001-PT015, FILE_EXTENSION_SPLIT)
- [x] Python CLI wrapper (`main.py`, `pyproject.toml`)
- [x] Unit tests for parser (12), validator (10), fixer (2)

## 0.0.4 Roadmap Plan Tasklist (completed)

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

- `ptree-syntax/src/core/parser.ts`
- `ptree-syntax/src/core/validator.ts`
- `ptree-syntax/src/formatter.ts`
- `ptree-syntax/src/cli.ts`
- `ptree-syntax/syntaxes/ptree.tmLanguage.json`
- `ptree-syntax/config/ptreeconfig.schema.json`
- `ptree-syntax/docs/SPEC.md`
- `ptree-syntax/docs/GRAMMAR.md`
- `ptree-syntax/docs/SEMANTIC_TOKENS.md`
- `ptree-syntax/CHANGELOG.md`
- `ptree-syntax/README.md`
- `ptree-syntax/samples/example.ptree`
- `pyproject.toml`
- `main.py`
- `README.md`

## Data model / API changes

- Extend AST to retain inline metadata/comments/symlink targets.
- Prefer `separation_delimiters` in output; accept `seperation_delimiters` as legacy alias.
- Add Python CLI entrypoint that proxies to compiled Node CLI.

## Action items

- [x] Set independent spec versioning rules: `@ptree: spec` + `@version: <SEMVER>`; default spec version to `1.0.0`.
- [x] Update docs/examples to use `@version: 1.0.0` and `@separation_delimiters`, with a deprecation note for the legacy spelling.
- [x] Update CLI `gen --profile spec` to emit `@separation_delimiters` and default spec `@version` to `1.0.0`.
- [x] Update schema/config to include `SEPARATION_DELIMITERS` and preserve legacy `SEPERATION_DELIMITERS`; define precedence rules.
- [x] Extend parser/formatter/fixer to preserve inline metadata/comments/symlink targets during formatting and fixes.
- [x] Consolidate parsing logic used by folding/path-copy into shared helpers or core parser output.
- [x] Tighten validator parity with GRAMMAR (extension rules, dotted-name constraints, directive validation).
- [x] Implement Python CLI wrapper (console script) that forwards args to Node CLI and reports missing Node/compiled artifacts clearly.
- [x] Add unit tests for formatter/fixer/CLI and regression fixtures for metadata/symlinks/spec headers.

## Testing and validation

- `cd ptree-syntax && npm run lint`
- `cd ptree-syntax && npm run test:unit`
- `cd ptree-syntax && npm run test`
- CLI smoke: `cd ptree-syntax && npm run ptree -- gen . --max-depth 2` and `npm run ptree -- validate samples/example.ptree`
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

## Message map (draft)

- Purpose: syntax-first directory tree language with clear highlighting and stable structure.
- Non-goals: not a filesystem CLI replacement; not a general-purpose markup language; no required config.
- User value: readable trees in editors/docs, fast scanning, optional validation when desired.
- Positioning: Markdown is a common host, not the goal.

## Appendix: Rule Reference

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

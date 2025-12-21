---
name: ptree-spec-alignment
description: Align spec versioning, delimiter spelling, and CLI wrapper.
---

# Plan

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

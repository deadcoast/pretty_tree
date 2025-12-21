# `ptree` GRAMMAR DRAFT - 0.1.0

## DISCLAIMER

This document defines the **opinionated, default grammar + ruleset** that `ptree` ships with.

- The **format** of a `ptree` document is specified in `docs/SPEC.md`.
- This document specifies the **naming grammar** and the **default lint rules**.
- Like `.markdownlint.json`, `ptree` provides:
  - a strict, useful default ruleset
  - a config file that users can override per repo/workspace
  - centrally managed definitions (especially `[NAME_TYPES]`) so highlighting, validation, and samples stay consistent

> Note on spelling: the canonical key is `[SEPARATION_DELIMITERS]`. The legacy spelling `[SEPERATION_DELIMITERS]` remains accepted for compatibility.

---

## Status and profiles (1.0.0 draft)

- **default profile**: friendly, low-friction rules meant to keep trees readable without extra work (this document)
- **spec profile**: canonical, stricter rules for shared docs and tooling; opt-in via `@ptree: spec`
- validation is optional; you can use `ptree` purely for highlighting and folding

---

## Canonical Profile: `@ptree: spec` (v1.0.0)

The **spec** profile is the opinionated, canonical ruleset meant to be shared in docs and tooling.
It matches the canonical header:

```ptree
@ptree: spec
@style: unicode
@version: 1.0.0
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type'
]
@separation_delimiters: [
    '-',
    '_',
    '.'
]
```

### Key constraints (spec profile)

- **ROOT** label must be: `PTREE-<@version>//`
- **DIR** names must match **High_Type** (Title_Snake), ending in `/`
- **FILE** naming rules apply to the **stem before the first dot**:
  - `parser.test.ts` → stem `parser` (**smol-type**), extension `test.ts`
  - `ptree.config.json` → stem `ptree` (**smol-type**), extension `config.json`

This first-dot stem behavior keeps the rules usable for real-world files (config files, test suffixes, multi-part extensions) without requiring an additional NAME_TYPE just for dots.

---

## DICTIONARY

### [NAME_TYPES]

A **central registry** of naming styles used to classify names for:

- **[ROOT]** labels
- **[DIR]** directory nodes
- **[FILE]** file nodes (base name, without extension)
- **[META]** meta nodes (names ending in `//`) and directive lines

Each name type defines:

- a **pattern** (regex) for matching a *bare* name  
  (no extension, no trailing `/`, no trailing `//`)
- a **WORD_DELIMITER** used *inside* the name (`-`, `_`, `.`, or none)
- allowed **VERSION_DELIMITERS** used to append a version number (`-` or `_`)

This registry is the *central point of reference* for config, linting, and examples.

### [SEPARATION_DELIMITERS]

Separation delimiters are characters used to separate:

- **words** inside a name (e.g. `data-dictionary`)
- a **name** from an appended **version** (e.g. `PTREE-1.0.0`)

Default delimiter set:

- `-` (hyphen)
- `_` (underscore)
- `.` (dot — restricted; see rules)

### [NUMBER]

A numeric token. In `ptree`, the primary number format is **[SEMVER]**.

### [SEMVER]

A semantic-version-like string:

- `MAJOR.MINOR.PATCH`
- optionally: `-prerelease`
- optionally: `+build`

Examples:

- `1.0.0`
- `0.2.3-alpha.1`
- `2.1.0+build.20251217`

### [WORD_DELIMITER]

The delimiter used **inside** a `[NAME_TYPE]` to separate words, e.g.:

- `SCREAM_TYPE`: `_`
- `smol-type`: `-`

### [VERSION_DELIMITER]

The delimiter used to append a version to a name, e.g.:

- `PTREE-1.0.0`
- `User-Guide_1.0.0`

---

## UNIVERSAL RULES

### RULE ONE

---
[UR1]

[NAME_TYPE] and [VERSION_DELIMITER] MUST NEVER use the same delimiter character **when the NAME_TYPE has a WORD_DELIMITER**.

- If the NAME_TYPE uses `_` inside the name, the version delimiter MUST be `-`.
- If the NAME_TYPE uses `-` inside the name, the version delimiter MUST be `_`.
- If the NAME_TYPE has no WORD_DELIMITER (e.g. `CamelType`), both `-` and `_` are allowed.

**Why:** this prevents ambiguous scanning like `NAME_TYPE_1.0.0` where `_` is doing double-duty.

#### EXAMPLES

---
[E01] [SCREAM_TYPE]

INCORRECT:

- `[SCREAM_TYPE]_[SEMVER]`
- output: `API_CLIENT_1.0.0`

CORRECT:

- `[SCREAM_TYPE]-[SEMVER]`
- output: `API_CLIENT-1.0.0`

---
[E02] [Cap-Type]

INCORRECT:

- `[Cap-Type]-[SEMVER]`
- output: `User-Guide-1.0.0`

CORRECT:

- `[Cap-Type]_[SEMVER]`
- output: `User-Guide_1.0.0`

---
[E03] [snake_type]

INCORRECT:

- `[snake_type]_[SEMVER]`
- output: `user_guide_1.0.0`

CORRECT:

- `[snake_type]-[SEMVER]`
- output: `user_guide-1.0.0`

---
[E04] [CamelType]

CORRECT (both allowed):

- `[CamelType]-[SEMVER]` → `BuildTools-1.0.0`
- `[CamelType]_[SEMVER]` → `BuildTools_1.0.0`

---
[E05] [smol-type]

INCORRECT:

- `[smol-type]-[SEMVER]` → `data-dictionary-1.0.0`

CORRECT:

- `[smol-type]_[SEMVER]` → `data-dictionary_1.0.0`

---

### [UniRule_2]

[DIR] nodes MUST end with `/`.

This is the opinionated choice `(A)`:

- makes directories unambiguous for humans and tools
- enables accurate syntax highlighting without multi-line inference
- enables stable parsing and validation

---

### [UniRule_3]

[ROOT] label MUST end with `//` in the **default ruleset**.

This makes the root label visually distinct from real filesystem directories (which end with `/`).

Example:

- `PTREE-1.0.0//`

---

### [UniRule_4]

Node names MUST NOT contain spaces in the default ruleset.

Use:

- `-` for readability in lowercase names (`smol-type`)
- `_` for readability in TitleCase names (`High_Type`)

---

### [UniRule_5]

[NAME_TYPE] MUST NOT mix `-` and `_` in a single bare name.

Examples:

- ✅ `data-dictionary`
- ✅ `data_dictionary`
- ❌ `data_dictionary-file`

---

### [UniRule_6]

`.` is reserved for:

1. [SEMVER] internal dots (`1.2.3`)
2. file extension separators (`readme.md`)
3. *explicitly allowed* dotted name types (e.g. `dot.smol-type`)

If dotted base names are not desired, disable dotted NAME_TYPES and/or enable stricter rules.

---

## [NAME_TYPES] DEFINITIONS

The authoritative registry is shipped in:

- `config/ptree.default-config.json` → `NAME_TYPES`

Each definition includes:

- WORD_DELIMITER
- ALLOWED_VERSION_DELIMITERS
- REGEX for the bare name
- canonical examples

### [SCREAM_TYPE]

- DESCRIPTION: `SCREAMING_SNAKE_CASE`
- WORD_DELIMITER: `_`
- ALLOWED_VERSION_DELIMITERS: `-`
- REGEX: `^[A-Z0-9]+(?:_[A-Z0-9]+)*$`

EXAMPLES:

- `PTREE`
- `API_CLIENT`
- `MY_TOOL`

WITH_NUMBER:

- `PTREE-1.0.0`
- `API_CLIENT-1.2.3`

---

### [High_Type]

- DESCRIPTION: `Pascal_Snake_Case`
- WORD_DELIMITER: `_`
- ALLOWED_VERSION_DELIMITERS: `-`
- REGEX: `^[A-Z][A-Za-z0-9]*(?:_[A-Z][A-Za-z0-9]*)*$`

EXAMPLES:

- `Front_Matter`
- `User_Guide`
- `I_Introduction`

WITH_NUMBER:

- `User_Guide-1.0.0`
- `I_Introduction-0.1.0`

---

### [Cap-Type]

- DESCRIPTION: `Title-Kebab-Case`
- WORD_DELIMITER: `-`
- ALLOWED_VERSION_DELIMITERS: `_`
- REGEX: `^[A-Z][A-Za-z0-9]*(?:-[A-Z][A-Za-z0-9]*)*$`

EXAMPLES:

- `User-Guide`
- `Api-Docs`
- `Project-Notes`

WITH_NUMBER:

- `User-Guide_1.0.0`
- `Api-Docs_0.2.0`

---

### [>CamelType]

- DESCRIPTION: `PascalCase`
- WORD_DELIMITER: none
- ALLOWED_VERSION_DELIMITERS: `-`, `_`
- REGEX: `^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$`

EXAMPLES:

- `BuildTools`
- `PtreeConfig`

WITH_NUMBER:

- `BuildTools-1.0.0`
- `BuildTools_1.0.0`

---

### [smol-type]

- DESCRIPTION: `kebab-case`
- WORD_DELIMITER: `-`
- ALLOWED_VERSION_DELIMITERS: `_`
- REGEX: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

EXAMPLES:

- `readme`
- `data-dictionary`
- `tree-parser`

WITH_NUMBER:

- `data-dictionary_1.0.0`

---

### [snake_type]

- DESCRIPTION: `snake_case`
- WORD_DELIMITER: `_`
- ALLOWED_VERSION_DELIMITERS: `-`
- REGEX: `^[a-z0-9]+(?:_[a-z0-9]+)*$`

EXAMPLES:

- `data_dictionary`
- `tree_parser`

WITH_NUMBER:

- `data_dictionary-1.0.0`

---

### (Default registry additions)

These are included by default for real-world compatibility:

- `[dotfile]`: `.gitignore`, `.env`, `.editorconfig`
- `[dotdir]`: `.github`, `.vscode`
- `[dot.smol-type]`: `tsconfig.base`, `vite.config`

---

## [ptree_default_config] - 1.0.0

The default configuration is shipped as:

- `config/ptree.default-config.json`

It is intended to be copied and customized (like `.markdownlint.json`).

### [ROOT] DIRECTORY

[ROOT-A]: Root label MUST end with `//`.

[ROOT-B]: Root label MUST follow this format:

- `[SCREAM_TYPE]-[SEMVER]//`

[ROOT-C]: If the `@root:` directive is present, it MUST end with `/` and represents the **real filesystem root path** used for resolving/copying paths.

Example:

```ptree
@ptree: 1.0
@style: unicode
@root: ./

PTREE-1.0.0//
```

### [DIR] DIRECTORIES

[DIR-A]: Directories MUST end with `/`.

[DIR-B]: Directory names SHOULD match one of the allowed DIR name types.

Default allowed DIR NAME_TYPES:

- `[Cap-Type]` (default preference)
- `[High_Type]` (allowed; useful for numbered/sectioned docs)
- `[CamelType]` (allowed)
- `[dotdir]` (allowed)

[DIR-C]: Directory titles MUST be single-line.

### [FILE] FILES

[FILE-A]: Files MAY have an extension. (Some files intentionally do not, e.g. `LICENSE`.)

[FILE-B]: File base names SHOULD match one of the allowed FILE name types.

Default allowed FILE NAME_TYPES:

- `[smol-type]` (default preference)
- `[snake_type]` (allowed)
- `[dotfile]` (allowed)
- `[dot.smol-type]` (allowed)
- `[CamelType]` (allowed)

[FILE-C]: File titles MUST be single-line.

### [EXT] EXTENSIONS

[EXT-A]: Extensions MUST be composed of ASCII letters/digits and MAY include `_` or `-`.

[EXT-B]: Extensions SHOULD be lowercase by default.

Examples:

- `.md`
- `.json`
- `.tar.gz`

### [META] METADATA

[META-A]: Metadata nodes MAY be represented as names ending with `//`.

[META-B]: Directive lines (starting with `@`) are treated as metadata.

[META-C]: Metadata titles MUST be single-line.

---

## [ptree_rules] - Default Rule IDs

The default rules are shipped in `config/ptree.default-config.json` under `RULES`.

A rule is referenced by an ID like `PT006` and has:

- `enabled: true|false`
- `severity: "error"|"warning"|"info"`
- optional rule-specific configuration

Example (markdownlint-style):

```json
{
  "RULES": {
    "default": true,
    "PT006": true,
    "PT009": { "enabled": false }
  }
}
```

---

## [ptree_config_files]

Like markdownlint, `ptree` looks for a config file in the workspace.

Recommended file names (first match wins):

- `.ptreerc.json`
- `.ptree.json`
- `ptree.config.json`

The default config used when no file is present is:

- `config/ptree.default-config.json`

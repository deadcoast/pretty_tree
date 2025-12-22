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

Universal Rules (UniRules) are naming conventions that apply across all NAME_TYPEs to ensure consistency and prevent ambiguity. Each UniRule is enforced by one or more validation rules (PT001-PT015).

### Rule ID Quick Reference

| Rule ID | UniRule | Description | Default Severity | Default Enabled |
|---------|---------|-------------|------------------|-----------------|
| PT000 | - | Parser errors and unknown directives | warning/info | always |
| PT001 | UniRule_3 | Root label must end with `//` | error | yes |
| PT002 | UniRule_2 | Directory nodes must end with `/` | error | yes |
| PT003 | - | Require `@ptree` directive | warning | yes |
| PT004 | - | Enforce NAME_TYPE patterns by entity | error | yes |
| PT005 | UniRule_1 | Version delimiter conflict | error | yes |
| PT006 | UniRule_4 | No spaces in node names | error | yes |
| PT007 | - | Extensions should be lowercase | warning | yes |
| PT008 | UniRule_5 | No mixing `-` and `_` in bare names | warning | yes |
| PT009 | - | Sibling sorting (dirs first, then files) | warning | **no** |
| PT010 | - | (spec) `@ptree` must be "spec" | error | spec only |
| PT011 | - | (spec) `@style` must be "unicode" | error | spec only |
| PT012 | - | (spec) `@version` must be SEMVER | error | spec only |
| PT013 | - | (spec) `@name_type` block required | error | spec only |
| PT014 | - | (spec) `@separation_delimiters` required | error | spec only |
| PT015 | - | (spec) Root label must be `PTREE-<@version>//` | error | spec only |

---

### [UniRule_1] Version Delimiter Conflict

[NAME_TYPE] and [VERSION_DELIMITER] MUST NEVER use the same delimiter character **when the NAME_TYPE has a WORD_DELIMITER**.

- If the NAME_TYPE uses `_` inside the name, the version delimiter MUST be `-`.
- If the NAME_TYPE uses `-` inside the name, the version delimiter MUST be `_`.
- If the NAME_TYPE has no WORD_DELIMITER (e.g. `CamelType`), both `-` and `_` are allowed.

**Rule ID:** PT005

**Severity:** error (default)

**Why:** This prevents ambiguous scanning like `NAME_TYPE_1.0.0` where `_` is doing double-duty as both word separator and version delimiter. Without this rule, parsers cannot reliably determine where the name ends and the version begins.

#### EXAMPLES

---
[E01] [SCREAM_TYPE]

SCREAM_TYPE uses `_` as word delimiter, so version delimiter must be `-`.

❌ INCORRECT:

- `[SCREAM_TYPE]_[SEMVER]`
- output: `API_CLIENT_1.0.0`
- **Error:** Version delimiter "_" must not match the SCREAM_TYPE word delimiter "_" (UniRule_1).

✅ CORRECT:

- `[SCREAM_TYPE]-[SEMVER]`
- output: `API_CLIENT-1.0.0`

---
[E02] [Cap-Type]

Cap-Type uses `-` as word delimiter, so version delimiter must be `_`.

❌ INCORRECT:

- `[Cap-Type]-[SEMVER]`
- output: `User-Guide-1.0.0`
- **Error:** Version delimiter "-" must not match the Cap-Type word delimiter "-" (UniRule_1).

✅ CORRECT:

- `[Cap-Type]_[SEMVER]`
- output: `User-Guide_1.0.0`

---
[E03] [snake_type]

snake_type uses `_` as word delimiter, so version delimiter must be `-`.

❌ INCORRECT:

- `[snake_type]_[SEMVER]`
- output: `user_guide_1.0.0`
- **Error:** Version delimiter "_" must not match the snake_type word delimiter "_" (UniRule_1).

✅ CORRECT:

- `[snake_type]-[SEMVER]`
- output: `user_guide-1.0.0`

---
[E04] [CamelType]

CamelType has no word delimiter, so both `-` and `_` are allowed.

✅ CORRECT (both allowed):

- `[CamelType]-[SEMVER]` → `BuildTools-1.0.0`
- `[CamelType]_[SEMVER]` → `BuildTools_1.0.0`

---
[E05] [smol-type]

smol-type uses `-` as word delimiter, so version delimiter must be `_`.

❌ INCORRECT:

- `[smol-type]-[SEMVER]` → `data-dictionary-1.0.0`
- **Error:** Version delimiter "-" must not match the smol-type word delimiter "-" (UniRule_1).

✅ CORRECT:

- `[smol-type]_[SEMVER]` → `data-dictionary_1.0.0`

---

### [UniRule_2] Directory Marker

[DIR] nodes MUST end with `/`.

This is the opinionated choice `(A)`:

- makes directories unambiguous for humans and tools
- enables accurate syntax highlighting without multi-line inference
- enables stable parsing and validation

**Rule ID:** PT002

**Severity:** error (default)

**Mode:** `parents` (default) - only validates nodes that have children

**Why:** Without trailing slashes, it's impossible to distinguish directories from extensionless files without filesystem access. This rule ensures ptree documents are self-describing.

#### EXAMPLES

✅ CORRECT:
```ptree
├── src/
├── docs/
└── tests/
```

❌ INCORRECT:
```ptree
├── src
├── docs
└── tests
```
**Error:** Parent node has children but does not end with "/" (directory marker).

---

### [UniRule_3] Root Label Marker

[ROOT] label MUST end with `//` in the **default ruleset**.

This makes the root label visually distinct from real filesystem directories (which end with `/`).

**Rule ID:** PT001

**Severity:** error (default)

**Why:** The double-slash `//` clearly distinguishes the root label (a logical name for the tree) from actual filesystem paths. This prevents confusion when copying paths from ptree documents.

#### EXAMPLES

✅ CORRECT:
```ptree
PTREE-1.0.0//
├── src/
└── README.md
```

❌ INCORRECT:
```ptree
PTREE-1.0.0/
├── src/
└── README.md
```
**Error:** Root line should be a root label ending with "//" (default ruleset).

---

### [UniRule_4] No Spaces in Names

Node names MUST NOT contain spaces in the default ruleset.

Use:

- `-` for readability in lowercase names (`smol-type`)
- `_` for readability in TitleCase names (`High_Type`)

**Rule ID:** PT006

**Severity:** error (default)

**Why:** Spaces in filenames cause issues with shell commands, URLs, and many tools. Using delimiters like `-` or `_` ensures compatibility across platforms and toolchains.

#### EXAMPLES

✅ CORRECT:
```ptree
├── user-guide/
├── User_Guide/
└── getting-started.md
```

❌ INCORRECT:
```ptree
├── user guide/
├── User Guide/
└── getting started.md
```
**Error:** Spaces are not allowed in node names in the default ruleset. Use "-" or "_".

---

### [UniRule_5] No Mixed Delimiters

[NAME_TYPE] MUST NOT mix `-` and `_` in a single bare name.

This rule prevents ambiguous names where the delimiter purpose is unclear.

**Rule ID:** PT008

**Severity:** warning (default)

**Why:** Mixing delimiters makes it impossible to determine the intended NAME_TYPE. Is `my_project-name` a snake_type with an errant hyphen, or a smol-type with an errant underscore? Consistent delimiter usage enables reliable classification.

#### EXAMPLES

✅ CORRECT:
- `data-dictionary` (smol-type, uses `-`)
- `data_dictionary` (snake_type, uses `_`)
- `user-guide-v2` (smol-type, consistent `-`)
- `user_guide_v2` (snake_type, consistent `_`)

❌ INCORRECT:
- `data_dictionary-file`
- `user-guide_v2`
- `my_project-name`

**Error:** Do not mix '-' and '_' in the same bare name (UniRule_5).

**Note:** This rule applies to the bare name only, not to version suffixes. A name like `data-dictionary_1.0.0` is valid because `_` is the version delimiter, not part of the bare name.

---

### [UniRule_6] Dot Reservation

`.` is reserved for:

1. [SEMVER] internal dots (`1.2.3`)
2. file extension separators (`readme.md`)
3. *explicitly allowed* dotted name types (e.g. `dot.smol-type`)

If dotted base names are not desired, disable dotted NAME_TYPES and/or enable stricter rules.

**Related Rules:** PT004 (NAME_TYPE enforcement), PT007 (extension validation)

**Why:** Dots have special meaning in filenames (extension separator) and versions (SEMVER). Unrestricted dot usage in base names creates parsing ambiguity. The `dot.smol-type` NAME_TYPE provides an escape hatch for legitimate use cases like `tsconfig.base.json`.

#### EXAMPLES

✅ CORRECT (extension separator):
```ptree
├── readme.md
├── config.json
└── data.tar.gz
```

✅ CORRECT (dot.smol-type NAME_TYPE):
```ptree
├── tsconfig.base.json
├── vite.config.ts
└── eslint.config.js
```

❌ INCORRECT (ambiguous dot usage without dot.smol-type):
```ptree
├── my.project.name/
└── user.data.file
```
**Error:** DIR name "my.project.name" does not match any allowed NAME_TYPES.

---

## Additional Validation Rules

Beyond the UniRules, ptree provides additional validation rules for specific use cases.

### [PT000] Parser Errors

Reports parser errors and unknown directives.

**Severity:** warning (parser errors), info (unknown directives)

**Examples:**

```ptree
@unknown_directive: value
```
**Info:** Unknown directive "@unknown_directive". This directive will be ignored.

---

### [PT003] Require @ptree Directive

The `@ptree` directive SHOULD be present in the document header.

**Severity:** warning (default)

**Why:** The `@ptree` directive declares the profile and enables profile-specific validation. Without it, the validator uses default settings which may not match the author's intent.

#### EXAMPLES

✅ CORRECT:
```ptree
@ptree: default

PROJECT//
├── src/
└── README.md
```

❌ INCORRECT (missing directive):
```ptree
PROJECT//
├── src/
└── README.md
```
**Warning:** Missing required directive: @ptree: <version>

---

### [PT004] NAME_TYPE Enforcement

Entity names (ROOT, DIR, FILE, META) MUST match their configured NAME_TYPE patterns.

**Severity:** error (default)

**Why:** Consistent naming conventions improve readability and enable tooling. This rule enforces the NAME_TYPE patterns defined in `ENTITY_NAME_TYPES`.

#### EXAMPLES

With default config (`DIR: ['Cap-Type', 'High_Type', 'CamelType', 'dotdir']`):

✅ CORRECT:
```ptree
├── User-Guide/
├── User_Guide/
├── UserGuide/
└── .github/
```

❌ INCORRECT:
```ptree
├── user-guide/
└── USER_GUIDE/
```
**Error:** DIR name "user-guide" does not match any allowed NAME_TYPES (Cap-Type, High_Type, CamelType, dotdir).

---

### [PT007] Extension Validation

File extensions SHOULD be lowercase.

**Severity:** warning (default)

**Why:** Lowercase extensions are the convention across most platforms and tools. Mixed-case extensions can cause issues on case-sensitive filesystems.

#### EXAMPLES

✅ CORRECT:
```ptree
├── readme.md
├── config.json
└── image.png
```

❌ INCORRECT:
```ptree
├── README.MD
├── Config.JSON
└── Image.PNG
```
**Warning:** File extension should be lowercase (found: .MD).

---

### [PT009] Sibling Sorting

Within each directory, list directories first, then files; each group sorted lexicographically.

**Severity:** warning (default)

**Enabled:** false (default) - opt-in rule

**Options:**
- `case_sensitive`: false (default) - case-insensitive sorting

**Why:** Consistent ordering makes trees easier to scan and compare. This matches the default behavior of many file explorers and the `tree` command.

#### EXAMPLES

✅ CORRECT:
```ptree
├── docs/
├── src/
├── tests/
├── README.md
└── package.json
```

❌ INCORRECT:
```ptree
├── README.md
├── docs/
├── package.json
├── src/
└── tests/
```
**Warning:** Sibling ordering violation: expected directories first, then files; each group lexicographically.

---

## Spec Profile Rules (PT010-PT015)

The spec profile (`@ptree: spec`) enables additional rules for canonical ptree documents. These rules are disabled by default and only activate when the profile is set to "spec".

### [PT010] Spec @ptree Value

In spec profile, `@ptree` directive value MUST be "spec".

**Severity:** error

---

### [PT011] Spec @style Value

In spec profile, `@style` directive MUST be "unicode".

**Severity:** error

---

### [PT012] Spec @version Required

In spec profile, `@version` directive is required and MUST be valid SEMVER.

**Severity:** error

---

### [PT013] Spec @name_type Block

In spec profile, `@name_type` block is required and MUST declare canonical NAME_TYPES:

```ptree
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type'
]
```

**Severity:** error

---

### [PT014] Spec @separation_delimiters Block

In spec profile, `@separation_delimiters` block is required and MUST declare:

```ptree
@separation_delimiters: [
    '-',
    '_',
    '.'
]
```

**Severity:** error

---

### [PT015] Spec Root Label Format

In spec profile, root label MUST be `PTREE-<@version>//` where the version matches the `@version` directive.

**Severity:** error

#### EXAMPLES

✅ CORRECT:
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

PTREE-1.0.0//
├── Docs/
└── readme.md
```

❌ INCORRECT (version mismatch):
```ptree
@ptree: spec
@version: 2.0.0

PTREE-1.0.0//
```
**Error:** Root label version "1.0.0" must match @version "2.0.0".

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

### [NUMERAL]

- DESCRIPTION: `Roman numeral prefix (I, II, III, IV, V, etc.)`
- WORD_DELIMITER: none
- ALLOWED_VERSION_DELIMITERS: `-`, `_`
- REGEX: `^[IVXLCDM]+$`

EXAMPLES:

- `I`
- `II`
- `III`
- `IV`
- `V`
- `X`
- `L`
- `C`
- `D`
- `M`

USAGE:

Roman numerals are used as prefixes for numbered sections in documentation trees. They are combined with an underscore separator and a standard NAME_TYPE:

- `I_Introduction/` → numeral `I` + `High_Type` remainder
- `II_Getting_Started/` → numeral `II` + `High_Type` remainder
- `III_Advanced_Topics/` → numeral `III` + `High_Type` remainder

The validator recognizes the `[NUMERAL]_[NAME]` pattern and validates:
1. The numeral portion against the NUMERAL NAME_TYPE
2. The remainder against the configured DIR NAME_TYPE

---

### [index-type]

- DESCRIPTION: `Index file prefix pattern: (index) or (index)-name`
- WORD_DELIMITER: `-`
- ALLOWED_VERSION_DELIMITERS: `_`
- REGEX: `^\(index\)(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$`

EXAMPLES:

- `(index)`
- `(index)-introduction`
- `(index)-chapter-one`
- `(index)-getting-started`

PATTERN BREAKDOWN:

```
(index)              - Literal "(index)" prefix (required)
(?:-[a-z0-9]+)*      - Optional kebab-case suffix segments
```

Valid patterns:
- `(index)` - Bare index file
- `(index)-name` - Index with single-word suffix
- `(index)-multi-word` - Index with multi-word kebab suffix

Invalid patterns:
- `(Index)` - Uppercase not allowed
- `(index)_name` - Underscore not allowed (use hyphen)
- `index` - Missing parentheses

USAGE:

Index files serve as the main entry point for a directory. The `(index)` prefix is a convention borrowed from web frameworks where `index.html` or `index.js` represents the default file for a directory.

In ptree, the `(index)` prefix:
- Is recognized as a special FILE NAME_TYPE
- Can be followed by an optional `-name` suffix
- The suffix (after the prefix) follows `smol-type` rules (lowercase kebab-case)
- Commonly used with `.md` extension for documentation entry points

Example tree:

```ptree
Docs/
├── (index).md              # Main entry point for Docs/
├── (index)-overview.md     # Alternative overview page
├── getting-started.md
└── Getting_Started/
    ├── (index).md          # Entry point for Getting_Started/
    └── (index)-tutorial.md # Tutorial variant
```

WHY USE INDEX FILES:

1. **Clear entry points**: Makes it obvious which file is the "main" file in a directory
2. **Consistent navigation**: Documentation generators can auto-link to index files
3. **Sorting**: Index files sort to the top when using `(` prefix
4. **Semantic meaning**: Distinguishes entry points from regular content files

---

### (Default registry additions)

These are included by default for real-world compatibility:

- `[dotfile]`: `.gitignore`, `.env`, `.editorconfig`
- `[dotdir]`: `.github`, `.vscode`
- `[dot.smol-type]`: `tsconfig.base`, `vite.config`

---

## Configuration Reference

This section documents all configuration options available in ptree config files.

### [ENTITY_NAME_TYPES]

Maps entity types to arrays of allowed NAME_TYPE identifiers. This determines which naming conventions are valid for each type of node in the tree.

```json
{
  "ENTITY_NAME_TYPES": {
    "ROOT": ["SCREAM_TYPE"],
    "DIR": ["Cap-Type", "High_Type", "CamelType", "dotdir"],
    "FILE": ["smol-type", "snake_type", "CamelType", "dotfile", "dot.smol-type", "index-type"],
    "EXT": ["smol-type"],
    "META": ["SCREAM_TYPE"],
    "NUMERAL": ["NUMERAL"]
  }
}
```

#### Entity Types

| Entity | Description | Default NAME_TYPEs |
|--------|-------------|-------------------|
| `ROOT` | Root labels (nodes ending with `//`) | `SCREAM_TYPE` |
| `DIR` | Directory names (nodes ending with `/`) | `Cap-Type`, `High_Type`, `CamelType`, `dotdir` |
| `FILE` | File names (stem portion before extension) | `smol-type`, `snake_type`, `CamelType`, `dotfile`, `dot.smol-type`, `index-type` |
| `EXT` | File extensions (portion after the split point) | `smol-type` |
| `META` | Metadata nodes (nodes ending with `//`) | `SCREAM_TYPE` |
| `NUMERAL` | Roman numeral prefixes in directory names | `NUMERAL` |

#### EXT Entity

The `EXT` entity type validates file extensions. By default, extensions must match `smol-type` (lowercase kebab-case).

**Examples:**

✅ Valid extensions:
- `.md`
- `.json`
- `.tar.gz` (multi-part extension)
- `.config.js`

❌ Invalid extensions (with PT007 enabled):
- `.MD` (uppercase)
- `.JSON` (uppercase)

#### NUMERAL Entity

The `NUMERAL` entity type validates Roman numeral prefixes used in numbered documentation sections. The validator recognizes the `[NUMERAL]_[NAME]` pattern and validates:

1. The numeral portion against the `NUMERAL` NAME_TYPE
2. The remainder against the configured `DIR` NAME_TYPE

**Examples:**

✅ Valid numeral-prefixed directories:
- `I_Introduction/`
- `II_Getting_Started/`
- `III_Advanced_Topics/`
- `IV_Reference/`
- `X_Appendix/`

---

### [FILE_EXTENSION_SPLIT]

Determines how to split a filename into base name and extension for NAME_TYPE validation.

```json
{
  "FILE_EXTENSION_SPLIT": "lastDot"
}
```

#### Options

| Value | Description | Example |
|-------|-------------|---------|
| `lastDot` | Split at the last dot. Extension is the final segment. | `parser.test.ts` → base: `parser.test`, ext: `ts` |
| `firstDot` | Split at the first dot. Extension includes all segments after. | `parser.test.ts` → base: `parser`, ext: `test.ts` |

#### Profile Defaults

- **default profile**: `lastDot` - More permissive, allows dots in base names
- **spec profile**: `firstDot` - Stricter, validates only the stem before the first dot

#### Use Cases

**`lastDot` (default)**:
- Best for projects with dotted base names like `tsconfig.base.json`
- The `dot.smol-type` NAME_TYPE handles these cases

**`firstDot` (spec)**:
- Best for canonical documentation trees
- Keeps FILE NAME_TYPE validation simple
- Multi-part extensions like `.test.ts`, `.config.json` are treated as extensions

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

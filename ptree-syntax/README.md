# ptree (Pretty Tree) — VS Code Extension + CLI (Optional)

`ptree` is a **standardized, human-friendly directory tree format** (`.ptree`). Spec 1.0.0 is the current draft, implemented by extension/CLI 0.0.5. The core goal is simple: make directory trees readable with syntax highlighting across editors and docs, without forcing extra complexity.

## Design goals (0.0.5 draft)

- Turn-key: readable with no configuration
- Simple defaults; strictness is opt-in
- Syntax-first: highlightable in editors and fenced blocks
- Consistent structure so tools can parse and validate

Designed for:

- Fast visual parsing (folders vs files vs extensions)
- Reliable copy/paste into documentation
- Editor ergonomics (folding / collapsing)
- Fenced code blocks (```ptree) for docs
- File Extension `.ptree`
- Optional naming + validation rules

## Vision (draft)

- Become the default tree language for syntax highlighting (goal).
- Keep the format simple to write by hand; strict rules stay optional.
- Provide an airtight, parser-friendly spec for tooling and themes.

This repository contains:

- a VS Code extension
- an optional CLI (`ptree gen` / `ptree validate`) that shares the same default ruleset

---

## Quick start (syntax highlighting)

1. Create a `.ptree` file.
2. Paste a minimal tree (see below).
3. Save the file; highlighting and folding should appear automatically.

No configuration is required for highlighting.

## Features

Most users only need highlighting and folding. Validation and strict naming are optional.

### 1) Syntax Highlighting

- Tree scaffold characters (`│`, `├──`, `└──`, etc.) are scoped as *comment-like* so themes typically dim them.
- Directory names (recommended with a trailing `/`) are highlighted distinctly.
- File extensions (`.md`, `.json`, `.tar.gz`, …) are highlighted as a separate token.
- Supports:
  - directive metadata (`@key: value`)
  - symlinks (`name -> target`)
  - inline metadata (`[key=value]`)
  - inline comments (`# comment`)

### 2) Folding / Collapsing

Unlike most tree snippets, a `.ptree` file uses **structural depth** (the tree prefix) rather than plain indentation.

This extension includes a FoldingRangeProvider that:

- folds any node that has children
- works with unicode tree output (`tree` command style)
- works with a simple ASCII tree style (`|--`, `` `-- ``)

### 3) Fenced Code Blocks

Once installed, you can write:

````markdown
```ptree
PTREE-1.0.0//
├── readme.md
└── Src/
    └── index.ts
```
````

…and VS Code will highlight the fenced block with the `ptree` grammar.

This is the simplest way to stop plain, unstyled tree blocks in docs (including Markdown) while keeping the format syntax-first.

### 4) Validation (Rules + NAME_TYPES)

Validation is optional; syntax highlighting works without any config. When you want stricter rules, `ptree` ships with an **opinionated default ruleset** (inspired by `.markdownlint.json`) including:

- directory nodes MUST end with `/`
- root label SHOULD end with `//`
- no spaces in node names (default)
- optional sibling sorting
- centralized `[NAME_TYPES]` definitions (kebab-case, snake_case, SCREAMING_SNAKE, etc.)

Files are validated automatically while you edit.

You can also run:

- **ptree: Validate Document** (`ptree.validateDocument`)

The default naming grammar is documented in:

- `docs/GRAMMAR.md`

### 5) Dynamic Semantic Highlighting (NAME_TYPES-aware)

TextMate grammars are **static**; they cannot read your workspace config. The **Semantic Tokens Provider** adds config-aware highlighting and mismatch markers.

The provider:

- reads the effective config (default/spec + optional user config)
- classifies each [ROOT]/[DIR]/[FILE] name against your `[NAME_TYPES]` regex registry
- emits semantic token modifiers like:
  - `nt_high_type`
  - `nt_smol_type`
  - `nt_scream_type`
- emits a `mismatch` modifier when a name does not conform to the allowed types for that entity

This is the mechanism that makes **"central NAME_TYPES drives highlighting"** real.

You can customize colors via:

```json
// settings.json
{
  "editor.semanticTokenColorCustomizations": {
    "rules": {
      "ptreeScaffold": {},
      "ptreeDir.nt_high_type": {},
      "ptreeFile.nt_smol_type": {},
      "ptreeDir.mismatch": {}
    }
  }
}
```

See also:

- `docs/SEMANTIC_TOKENS.md`

---

## Supported Syntax

Directives are optional; the tree format stands on its own.

### Minimal (no directives)

```ptree
my-project/
├── README.md
└── src/
    └── index.ts
```

### Recommended (default ruleset)

```ptree
@ptree: 1.0
@style: unicode
@root: ./

PTREE-1.0.0//
├── readme.md
├── changelog.md
└── Src/
    ├── index.ts
    └── tree-parser.ts
```

### ASCII style (fallback)

```ptree
my-project/
|-- README.md
`-- src/
    `-- index.ts
```

### Inline metadata

```ptree
PTREE-1.0.0//
├── readme.md  # docs entry
├── package.json  [type=node]
└── Src/  [lang=ts]
    └── index.ts  # entrypoint
```

### Symlinks

```ptree
PTREE-1.0.0//
└── current -> releases/2025-12-17/
```

---

## Commands

- **ptree: Copy Full Path at Cursor** (`ptree.copyPathAtCursor`)
- **ptree: Copy Relative Path at Cursor** (`ptree.copyRelativePathAtCursor`)
- **ptree: Validate Document** (`ptree.validateDocument`)
- **ptree: Apply Canonical Fixes** (`ptree.fixDocument`)
- **ptree: Format Document** (`ptree.formatDocument`) — or use VS Code's `Format Document` (Shift+Alt+F)

Path commands infer the path by walking up the tree structure.

> Tip: if you provide `@root: ./` (or any real path ending in `/`), the copy-path commands will use it as the filesystem prefix.

---

## Configuration

If you only want highlighting and folding, no config is required.

`ptree` looks for a config file in the workspace root (first match wins):

- `.ptreerc.json`
- `.ptree.json`
- `ptree.config.json`

The shipped default is:

- `config/ptree.default-config.json`

VS Code validates these JSON config files using:

- `config/ptreeconfig.schema.json`

### Profiles

`ptree` ships with **two built-in rulesets**:

- **default** — flexible, friendly defaults (good for general trees)
- **spec** — the **canonical**, stricter ruleset for shared docs and tooling

How the profile is chosen:

- In **VS Code**, the extension auto-selects the profile per document:
  - `@ptree: spec` → uses the **spec** profile
  - anything else → uses the **default** profile
- In the **CLI (optional)**, you can force it with `--profile spec|default` (otherwise it auto-detects from `@ptree:`).

The canonical **spec** profile also changes one important parsing detail:

- FILE naming rules apply to the **stem before the first dot** (e.g. `vite.config.ts` → stem `vite`, extension `config.ts`).

---

## Development

```bash
npm i
npm run compile
```

Then press **F5** in VS Code to launch an Extension Development Host.

---

## CLI (optional)

After compiling, you can run:

```bash
npm i
npm run compile

# Generate a ptree from the filesystem (default profile)
node bin/ptree.js gen . --style unicode --max-depth 5

# Generate a canonical spec header + tree
node bin/ptree.js gen . --profile spec --version 1.0.0 --max-depth 5

# Validate a ptree file (auto-detects profile from @ptree: ...)
node bin/ptree.js validate samples/example.ptree

# Fix safe mechanical issues in-place
node bin/ptree.js validate samples/example.ptree --fix --write
```

### CLI Options Reference

#### `gen` Command

Generate a ptree from the filesystem.

```
ptree gen [path] [options]
```

| Option | Description |
|--------|-------------|
| `--profile default\|spec` | Profile to use (default: `default`) |
| `--style unicode\|ascii` | Tree style (default: `unicode`) |
| `--max-depth N` | Maximum directory depth (default: `25`) |
| `--version X` | Version string for root label |
| `--name-type ENTITY:TYPE,...` | Naming conventions (see below) |

#### `validate` Command

Validate a ptree file against the configured rules.

```
ptree validate <file.ptree> [options]
```

| Option | Description |
|--------|-------------|
| `--profile default\|spec` | Force a profile (auto-detects from `@ptree:` if omitted) |
| `--workspace-root DIR` | Directory for config lookup |
| `--fix` | Apply safe mechanical fixes |
| `--write` | Write fixes in-place (requires `--fix`) |
| `--format text\|json` | Output format (default: `text`) |
| `--diff` | Preview fixes as unified diff without applying |

### JSON Output (`--format json`)

For CI/CD integration and machine-readable output, use `--format json`:

```bash
node bin/ptree.js validate samples/example.ptree --format json
```

Output format:

```json
[
  {
    "file": "samples/example.ptree",
    "line": 5,
    "column": 1,
    "code": "PT002",
    "severity": "ERROR",
    "message": "Directory node must end with '/'"
  }
]
```

An empty array `[]` indicates no validation errors.

### Diff Preview (`--diff`)

Preview what fixes would be applied without modifying the file:

```bash
node bin/ptree.js validate samples/example.ptree --diff
```

Output is a unified diff showing proposed changes:

```diff
--- a/samples/example.ptree
+++ b/samples/example.ptree
@@ -5,3 +5,3 @@
-├── Src
+├── Src/
```

Combine with `--format json` for structured diff output:

```bash
node bin/ptree.js validate samples/example.ptree --diff --format json
```

### NAME_TYPE Specification (`--name-type`)

Control naming conventions for generated trees using `--name-type`:

```bash
# Specify DIR and FILE naming conventions
node bin/ptree.js gen . --name-type DIR:High_Type,FILE:smol-type

# Use with spec profile (overrides defaults)
node bin/ptree.js gen . --profile spec --name-type DIR:CamelType,FILE:snake_type
```

Available NAME_TYPEs:

| NAME_TYPE | Pattern | Example |
|-----------|---------|---------|
| `SCREAM_TYPE` | `UPPER_SNAKE_CASE` | `MY_PROJECT`, `CONFIG_FILE` |
| `High_Type` | `Title_Snake_Case` | `My_Project`, `Config_File` |
| `Cap-Type` | `Title-Kebab-Case` | `My-Project`, `Config-File` |
| `CamelType` | `PascalCase` | `MyProject`, `ConfigFile` |
| `smol-type` | `lower-kebab-case` | `my-project`, `config-file` |
| `snake_type` | `lower_snake_case` | `my_project`, `config_file` |

Format: `ENTITY:TYPE,ENTITY:TYPE` where ENTITY is `DIR` or `FILE`.

---

## License

MIT — see `LICENSE`.

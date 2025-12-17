# ptree (Pretty Tree) — VS Code Extension + CLI Toolkit

`ptree` is a **standardized, human-friendly directory tree format** (`.ptree`) designed for:

- fast visual parsing (folders vs files vs extensions)
- reliable copy/paste into documentation
- editor ergonomics (folding / collapsing)
- Markdown adoption (```ptree fenced code blocks)
- **opinionated naming + validation** (markdownlint-style rules)

This repository contains:

- a VS Code extension
- a small CLI (`ptree gen` / `ptree validate`) that shares the same default ruleset

---

## Features

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

### 3) Markdown Integration

Once installed, you can write:

````markdown
```ptree
PTREE-0.0.2//
├── readme.md
└── Src/
    └── index.ts
```
````

…and VS Code will highlight the fenced block with the `ptree` grammar.

### 4) Validation (Rules + NAME_TYPES)

`ptree` ships with an **opinionated default ruleset** (inspired by `.markdownlint.json`) including:

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

TextMate grammars are **static**; they can't read your workspace config to decide how to colorize
custom `[NAME_TYPES]`.

`ptree` now includes a **Semantic Tokens Provider** that:

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

### Recommended (default ruleset)

```ptree
@ptree: 1.0
@style: unicode
@root: ./

PTREE-0.0.2//
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
PTREE-0.0.2//
├── readme.md  # docs entry
├── package.json  [type=node]
└── Src/  [lang=ts]
    └── index.ts  # entrypoint
```

### Symlinks

```ptree
PTREE-0.0.2//
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
- **spec** — the **canonical**/opinionated ruleset that matches the “canon settings” header you provided

How the profile is chosen:

- In **VS Code**, the extension auto-selects the profile per document:
  - `@ptree: spec` → uses the **spec** profile
  - anything else → uses the **default** profile
- In the **CLI**, you can force it with `--profile spec|default` (otherwise it auto-detects from `@ptree:`).

The canonical **spec** profile also changes one important parsing detail:

- FILE naming rules apply to the **stem before the first dot** (e.g. `vite.config.ts` → stem `vite`, extension `config.ts`).

---

## CLI

After compiling, you can run:

```bash
npm i
npm run compile

# Generate a ptree from the filesystem (default profile)
node bin/ptree.js gen . --style unicode --max-depth 5

# Generate a canonical spec header + tree
node bin/ptree.js gen . --profile spec --version 0.0.2 --max-depth 5

# Validate a ptree file (auto-detects profile from @ptree: ...)
node bin/ptree.js validate samples/example.ptree

# Fix safe mechanical issues in-place
node bin/ptree.js validate samples/example.ptree --fix --write
```

---

## Development

```bash
npm i
npm run compile
```

Then press **F5** in VS Code to launch an Extension Development Host.

---

## License

MIT — see `LICENSE`.

# Semantic Tokens in `ptree`

Semantic tokens are the dynamic highlighting layer that makes `ptree` readable at a glance. They apply config-aware colors to roots, directories, files, and extensions based on your `NAME_TYPES`.

`ptree` uses two highlighting layers in VS Code:

1. **TextMate grammar** (`syntaxes/ptree.tmLanguage.json`)
2. **Semantic Tokens Provider** (`src/semanticTokens.ts`)

The TextMate layer is a good baseline, but it is **static**. The Semantic Tokens layer reads your config and adds name-type modifiers and mismatch markers. If you do nothing, you still get baseline highlighting.

---

## What the Semantic Tokens layer does

On each `.ptree` document, the provider:

- loads the effective config (built-in `default` or `spec`, merged with `.ptreerc.json` / `.ptree.json` / `ptree.config.json`)
- compiles your `NAME_TYPES` patterns (regex)
- classifies:
  - **ROOT** label
  - **DIR** names (including Roman numeral prefixes)
  - **FILE** stems (including index file prefixes)
  - **EXT** file extensions
  - **META** metadata nodes
  - name type identifiers inside `@name_type:[ ... ]`
- emits `nt_*` modifiers and a `mismatch` modifier when a name does not conform

---

## Token types

The extension contributes these token types:

| Token Type | Description | Example |
|------------|-------------|---------|
| `ptreeScaffold` | Tree characters and connectors | `├──`, `└──`, `│` |
| `ptreeDirective` | `@directive` keys | `@ptree`, `@version` |
| `ptreeDirectiveValue` | Directive values | `spec`, `unicode` |
| `ptreeRoot` | Root label/path | `PTREE-1.0.0//` |
| `ptreeDir` | Directory names | `src/`, `User_Guide/` |
| `ptreeFile` | File stem (before extension) | `readme`, `parser` |
| `ptreeExtension` | File extension portion | `md`, `ts`, `json` |
| `ptreeMeta` | Inline metadata, markers, comments | `/`, `//`, `# comment` |
| `ptreeSemver` | Semantic version tokens | `1.0.0`, `0.2.3-alpha` |
| `ptreeNameType` | Name type identifiers | `High_Type`, `smol-type` |
| `ptreeNumeral` | Roman numeral prefixes | `I`, `II`, `III`, `IV` |
| `ptreeIndex` | Index file prefix | `(index)` |

---

## Token modifiers

### `nt_*` modifiers

For each name type ID in your config, the provider produces a modifier:

```
nt_<sanitized_name_type>
```

Sanitization rule:

- lowercase
- non-alphanumeric characters become `_`

Examples:

| NAME_TYPE | Modifier |
|-----------|----------|
| `SCREAM_TYPE` | `nt_scream_type` |
| `High_Type` | `nt_high_type` |
| `smol-type` | `nt_smol_type` |
| `dot.smol-type` | `nt_dot_smol_type` |
| `CamelType` | `nt_cameltype` |
| `snake_type` | `nt_snake_type` |
| `NUMERAL` | `nt_numeral` |
| `index-type` | `nt_index_type` |

### `mismatch`

Applied when a name fails the allowed-name-type mapping for the entity.

For example, if `DIR` only allows `High_Type` but a directory is named `my-directory` (which matches `smol-type`), the token will have both `nt_smol_type` and `mismatch` modifiers.

### `unknown`

Used for name type identifiers inside `@name_type` that do not exist in the loaded `NAME_TYPES` registry.

### `nt_custom`

Fallback modifier when a name doesn't match any known NAME_TYPE pattern.

---

## Special Token Handling

### Roman Numeral Prefixes (`ptreeNumeral`)

When a directory name starts with a Roman numeral followed by underscore (e.g., `I_Introduction/`), the provider:

1. Emits `ptreeNumeral` for the Roman numeral portion (`I`)
2. Emits `ptreeMeta` for the underscore separator
3. Emits `ptreeDir` with appropriate NAME_TYPE modifier for the remainder (`Introduction`)

Example highlighting for `II_Getting_Started/`:
- `II` → `ptreeNumeral`
- `_` → `ptreeMeta`
- `Getting_Started` → `ptreeDir` with `nt_high_type`
- `/` → `ptreeMeta`

### Index File Prefixes (`ptreeIndex`)

When a file name starts with `(index)` (e.g., `(index)-overview.md`), the provider:

1. Emits `ptreeIndex` for the `(index)` prefix
2. Emits `ptreeMeta` for the separator (if present)
3. Emits `ptreeFile` with appropriate NAME_TYPE modifier for the remainder
4. Emits `ptreeExtension` for the file extension

Example highlighting for `(index)-overview.md`:
- `(index)` → `ptreeIndex`
- `-` → `ptreeMeta`
- `overview` → `ptreeFile` with `nt_smol_type`
- `md` → `ptreeExtension` with `nt_smol_type`

### Symlinks

When a node contains ` -> ` arrow syntax (e.g., `current -> releases/v1.0.0/`), the provider:

1. Emits appropriate token for the name portion (`ptreeDir` or `ptreeFile`)
2. Emits `ptreeMeta` for the arrow and surrounding spaces
3. Emits `ptreeMeta` for the target path

### Inline Metadata

When a node has inline metadata (bracket attributes or comments), the provider:

1. Emits appropriate tokens for the name portion
2. Emits `ptreeMeta` for everything after the name (attributes, comments)

Example: `package.json  [type=node]`
- `package` → `ptreeFile`
- `json` → `ptreeExtension`
- `  [type=node]` → `ptreeMeta`

---

## Customizing colors in VS Code

You can customize colors via your `settings.json`:

```json
{
  "editor.semanticHighlighting.enabled": true,
  "editor.semanticTokenColorCustomizations": {
    "rules": {
      "ptreeScaffold": {
        "foreground": "#6A737D",
        "fontStyle": ""
      },
      "ptreeRoot": {
        "foreground": "#F97583",
        "fontStyle": "bold"
      },
      "ptreeDir": {
        "foreground": "#79B8FF"
      },
      "ptreeDir.nt_high_type": {
        "foreground": "#85E89D"
      },
      "ptreeFile": {
        "foreground": "#E1E4E8"
      },
      "ptreeFile.nt_smol_type": {
        "foreground": "#B392F0"
      },
      "ptreeExtension": {
        "foreground": "#FFAB70"
      },
      "ptreeNumeral": {
        "foreground": "#F9C513",
        "fontStyle": "bold"
      },
      "ptreeIndex": {
        "foreground": "#56D4DD",
        "fontStyle": "italic"
      },
      "ptreeDir.mismatch": {
        "foreground": "#F97583",
        "fontStyle": "underline"
      },
      "ptreeFile.mismatch": {
        "foreground": "#F97583",
        "fontStyle": "underline"
      },
      "ptreeSemver": {
        "foreground": "#79B8FF"
      },
      "ptreeMeta": {
        "foreground": "#6A737D"
      }
    }
  }
}
```

### Theme-specific customization

You can also customize per theme:

```json
{
  "editor.semanticTokenColorCustomizations": {
    "[One Dark Pro]": {
      "rules": {
        "ptreeNumeral": {
          "foreground": "#E5C07B",
          "fontStyle": "bold"
        }
      }
    },
    "[GitHub Dark]": {
      "rules": {
        "ptreeNumeral": {
          "foreground": "#F9C513"
        }
      }
    }
  }
}
```

---

## Complete Token Reference

### Token Types with Common Modifiers

| Token Type | Common Modifiers | Description |
|------------|------------------|-------------|
| `ptreeScaffold` | (none) | Tree drawing characters |
| `ptreeDirective` | (none) | Directive keys like `@ptree` |
| `ptreeDirectiveValue` | (none) | Values after directive keys |
| `ptreeRoot` | `nt_scream_type`, `mismatch` | Root label |
| `ptreeDir` | `nt_high_type`, `nt_cap_type`, `mismatch` | Directory names |
| `ptreeFile` | `nt_smol_type`, `nt_snake_type`, `mismatch` | File stems |
| `ptreeExtension` | `nt_smol_type`, `mismatch` | File extensions |
| `ptreeMeta` | (none) | Markers, comments, metadata |
| `ptreeSemver` | (none) | Version numbers |
| `ptreeNameType` | `nt_*`, `unknown` | NAME_TYPE identifiers in directives |
| `ptreeNumeral` | (none) | Roman numeral prefixes |
| `ptreeIndex` | (none) | Index file `(index)` prefix |

---

## Notes

- Semantic tokens are enabled by default for the `ptree` language via `configurationDefaults` in `package.json`.
- TextMate highlighting remains in place as a fallback and for non-semantic themes.
- The semantic token provider refreshes automatically when you save config changes.
- If a name matches multiple NAME_TYPEs, the first match in the allowed list is used.

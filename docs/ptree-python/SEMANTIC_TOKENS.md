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

The extension contributes 19 token types:

| Token Type | Description | Example |
|------------|-------------|---------|
| `ptreeScaffold` | Tree characters and connectors | `├──`, `└──`, `│` |
| `ptreeDirective` | `@directive` keys | `@ptree`, `@version` |
| `ptreeDirectiveValue` | Directive values | `spec`, `unicode` |
| `ptreeRoot` | Root label/path | `PTREE-1.0.0//` |
| `ptreeDir` | Directory names | `src/`, `User_Guide/` |
| `ptreeFile` | File stem (before extension) | `readme`, `parser` |
| `ptreeExtension` | File extension portion | `md`, `ts`, `json` |
| `ptreeMeta` | Inline metadata, markers, comments | `/`, `//` |
| `ptreeSemver` | Semantic version tokens | `1.0.0`, `0.2.3-alpha` |
| `ptreeNameType` | Name type identifiers | `High_Type`, `smol-type` |
| `ptreeNumeral` | Roman numeral prefixes | `I`, `II`, `III`, `IV` |
| `ptreeIndex` | Index file prefix | `(index)` |
| `ptreeSymlink` | Symlink name (before arrow) | `current`, `latest` |
| `ptreeSymlinkArrow` | Symlink arrow operator | ` -> ` |
| `ptreeSymlinkTarget` | Symlink target path | `releases/v1.0.0/` |
| `ptreeAttribute` | Bracket attribute delimiters | `[`, `]` |
| `ptreeAttributeKey` | Attribute key in brackets | `type`, `size` |
| `ptreeAttributeValue` | Attribute value in brackets | `dir`, `1024` |
| `ptreeInlineComment` | Inline comment hash and text | `# comment` |

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

### Symlinks (`ptreeSymlink`, `ptreeSymlinkArrow`, `ptreeSymlinkTarget`)

When a node contains ` -> ` arrow syntax (e.g., `current -> releases/v1.0.0/`), the provider emits distinct tokens for each component:

1. `ptreeSymlink` for the symlink name (with NAME_TYPE modifier)
2. `ptreeSymlinkArrow` for the arrow operator (` -> `)
3. `ptreeSymlinkTarget` for the target path
4. `ptreeMeta` for any trailing metadata after the target

Example highlighting for `current -> releases/v1.0.0/  [type=dir]`:
- `current` → `ptreeSymlink` with `nt_smol_type`
- ` -> ` → `ptreeSymlinkArrow`
- `releases/v1.0.0/` → `ptreeSymlinkTarget`
- `  [type=dir]` → `ptreeMeta`

Symlink names are validated against FILE NAME_TYPE rules, as symlinks are classified as files regardless of whether they point to directories.

### Inline Metadata (`ptreeAttribute`, `ptreeAttributeKey`, `ptreeAttributeValue`, `ptreeInlineComment`)

When a node has inline metadata (bracket attributes or comments), the provider emits distinct tokens for each component:

#### Bracket Attributes

For bracket attributes like `[key=value, flag]`, the provider emits:

1. `ptreeAttribute` for the bracket delimiters (`[` and `]`)
2. `ptreeAttributeKey` for attribute keys (`key`, `flag`)
3. `ptreeMeta` for the equals sign (`=`) and comma separators (`,`)
4. `ptreeAttributeValue` for attribute values (`value`)

Example highlighting for `package.json  [type=node, cached]`:
- `package` → `ptreeFile`
- `json` → `ptreeExtension`
- `[` → `ptreeAttribute`
- `type` → `ptreeAttributeKey`
- `=` → `ptreeMeta`
- `node` → `ptreeAttributeValue`
- `,` → `ptreeMeta`
- `cached` → `ptreeAttributeKey`
- `]` → `ptreeAttribute`

#### Inline Comments

For inline comments like `# comment text`, the provider emits:

1. `ptreeInlineComment` for the hash symbol (`#`)
2. `ptreeInlineComment` for the comment text

Example highlighting for `readme.md  # documentation`:
- `readme` → `ptreeFile`
- `md` → `ptreeExtension`
- `#` → `ptreeInlineComment`
- `documentation` → `ptreeInlineComment`

#### Combined Attributes and Comments

Bracket attributes and inline comments can appear together:

Example highlighting for `config.json  [env=prod]  # production config`:
- `config` → `ptreeFile`
- `json` → `ptreeExtension`
- `[env=prod]` → attribute tokens as above
- `#` → `ptreeInlineComment`
- `production config` → `ptreeInlineComment`

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
      "ptreeSymlink": {
        "foreground": "#56D4DD",
        "fontStyle": "italic"
      },
      "ptreeSymlinkArrow": {
        "foreground": "#6A737D"
      },
      "ptreeSymlinkTarget": {
        "foreground": "#9ECBFF",
        "fontStyle": "italic"
      },
      "ptreeAttribute": {
        "foreground": "#79B8FF"
      },
      "ptreeAttributeKey": {
        "foreground": "#B392F0"
      },
      "ptreeAttributeValue": {
        "foreground": "#9ECBFF"
      },
      "ptreeInlineComment": {
        "foreground": "#6A737D",
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
        },
        "ptreeAttribute": {
          "foreground": "#61AFEF"
        },
        "ptreeAttributeKey": {
          "foreground": "#E06C75"
        },
        "ptreeAttributeValue": {
          "foreground": "#98C379"
        },
        "ptreeInlineComment": {
          "foreground": "#5C6370",
          "fontStyle": "italic"
        }
      }
    },
    "[GitHub Dark]": {
      "rules": {
        "ptreeNumeral": {
          "foreground": "#F9C513"
        },
        "ptreeAttribute": {
          "foreground": "#79B8FF"
        },
        "ptreeAttributeKey": {
          "foreground": "#B392F0"
        },
        "ptreeAttributeValue": {
          "foreground": "#9ECBFF"
        },
        "ptreeInlineComment": {
          "foreground": "#6A737D",
          "fontStyle": "italic"
        }
      }
    }
  }
}
```

### Customizing Index and Numeral Modifiers

You can style index files and numeral prefixes with their specific modifiers:

```json
{
  "editor.semanticTokenColorCustomizations": {
    "rules": {
      "ptreeIndex.nt_index_type": {
        "foreground": "#56D4DD",
        "fontStyle": "italic"
      },
      "ptreeNumeral.nt_numeral": {
        "foreground": "#F9C513",
        "fontStyle": "bold"
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
| `ptreeMeta` | (none) | Markers, separators, delimiters |
| `ptreeSemver` | (none) | Version numbers |
| `ptreeNameType` | `nt_*`, `unknown` | NAME_TYPE identifiers in directives |
| `ptreeNumeral` | `nt_numeral` | Roman numeral prefixes |
| `ptreeIndex` | `nt_index_type` | Index file `(index)` prefix |
| `ptreeSymlink` | `nt_smol_type`, `mismatch` | Symlink names |
| `ptreeSymlinkArrow` | (none) | Symlink arrow operator ` -> ` |
| `ptreeSymlinkTarget` | (none) | Symlink target paths |
| `ptreeAttribute` | (none) | Bracket delimiters `[` `]` |
| `ptreeAttributeKey` | (none) | Attribute keys in brackets |
| `ptreeAttributeValue` | (none) | Attribute values in brackets |
| `ptreeInlineComment` | (none) | Inline comment `#` and text |

### All Token Modifiers

| Modifier | Description | Applied To |
|----------|-------------|------------|
| `nt_scream_type` | Matches SCREAM_TYPE pattern | Root, Dir, File |
| `nt_high_type` | Matches High_Type pattern | Dir, File |
| `nt_smol_type` | Matches smol-type pattern | Dir, File, Extension |
| `nt_snake_type` | Matches snake_type pattern | Dir, File |
| `nt_cameltype` | Matches CamelType pattern | Dir, File |
| `nt_dot_smol_type` | Matches dot.smol-type pattern | Dir, File |
| `nt_numeral` | Matches NUMERAL pattern | Numeral prefixes |
| `nt_index_type` | Matches index-type pattern | Index file prefixes |
| `nt_custom` | Fallback when no pattern matches | Any name token |
| `mismatch` | Name doesn't match allowed types | Root, Dir, File, Extension |
| `unknown` | Unknown NAME_TYPE in directive | NameType tokens |

---

## Notes

- Semantic tokens are enabled by default for the `ptree` language via `configurationDefaults` in `package.json`.
- TextMate highlighting remains in place as a fallback and for non-semantic themes.
- The semantic token provider refreshes automatically when you save config changes.
- If a name matches multiple NAME_TYPEs, the first match in the allowed list is used.

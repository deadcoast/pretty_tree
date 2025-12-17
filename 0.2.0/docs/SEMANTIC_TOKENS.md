# Semantic Tokens in `ptree`

`ptree` uses two highlighting layers in VS Code:

1. **TextMate grammar** (`syntaxes/ptree.tmLanguage.json`)
2. **Semantic Tokens Provider** (`src/semanticTokens.ts`)

The TextMate layer is a good baseline, but it is **static**. It cannot read your workspace configuration and therefore cannot truly implement "central `[NAME_TYPES]` drives highlighting".

The Semantic Tokens layer is the dynamic layer.

---

## What the Semantic Tokens layer does

On each `.ptree` document, the provider:

- loads the effective config (built-in `default` or `spec`, merged with `.ptreerc.json` / `.ptree.json` / `ptree.config.json`)
- compiles your `NAME_TYPES` patterns (regex)
- classifies:
  - **ROOT** label
  - **DIR** names
  - **FILE** stems
  - name type identifiers inside `@name_type:[ ... ]`

It then emits tokens such as:

- token type: `ptreeDir`
- token modifier: `nt_high_type`

If the name is not allowed for that entity, it adds:

- token modifier: `mismatch`

---

## Token types

The extension contributes these token types:

- `ptreeScaffold` — tree characters and connectors
- `ptreeDirective` — `@directive` keys
- `ptreeDirectiveValue` — directive values
- `ptreeRoot` — root label/path
- `ptreeDir` — directory names
- `ptreeFile` — file stem
- `ptreeExtension` — file extension portion
- `ptreeMeta` — inline metadata and markers (`/`, `//`, comments)
- `ptreeSemver` — semantic version tokens
- `ptreeNameType` — name type identifiers like `High_Type`

---

## Token modifiers

### `nt_*` modifiers

For each name type ID in your config, the provider produces a modifier:

```nt
nt_<sanitized_name_type>
```

Sanitization rule:

- lowercase
- non-alphanumeric characters become `_`

Examples:

- `SCREAM_TYPE` → `nt_scream_type`
- `High_Type` → `nt_high_type`
- `smol-type` → `nt_smol_type`
- `dot.smol-type` → `nt_dot_smol_type`

### `mismatch`

Applied when a name fails the allowed-name-type mapping for the entity.

### `unknown`

Used for name type identifiers inside `@name_type` that do not exist in the loaded `NAME_TYPES` registry.

---

## Customizing colors in VS Code

You can customize colors via:

```json
{
  "editor.semanticHighlighting.enabled": true,
  "editor.semanticTokenColorCustomizations": {
    "rules": {
      "ptreeScaffold": {},
      "ptreeDir.nt_high_type": {},
      "ptreeFile.nt_smol_type": {},
      "ptreeDir.mismatch": {},
      "ptreeFile.mismatch": {}
    }
  }
}
```

Populate the objects with `foreground`/`fontStyle` according to your preference.

---

## Notes

- Semantic tokens are enabled by default for the `ptree` language via `configurationDefaults` in `package.json`.
- TextMate highlighting remains in place as a fallback and for non-semantic themes.

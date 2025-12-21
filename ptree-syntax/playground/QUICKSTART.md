# ptree Playground Quick Start

Get started with ptree syntax highlighting and validation in under 2 minutes!

## Prerequisites

- VS Code with the ptree extension installed
- Node.js (for CLI commands)

---

## 🎨 See Syntax Highlighting (30 seconds)

1. **Open this folder** in VS Code
2. **Open** `demos/08-all-features.ptree`
3. **Done!** You should see colorful syntax highlighting:
   - 🔴 Root labels in bold
   - 🔵 Directories in blue
   - ⚪ Files in default color
   - 🟠 Extensions in orange
   - 🟡 Roman numerals in yellow
   - 🟣 Symlinks in purple/italic

> **Tip:** If colors don't appear, check that semantic highlighting is enabled in VS Code settings.

---

## ✅ Test Validation (30 seconds)

1. **Open** `rules/pt006-no-spaces.ptree`
2. **Open the Problems panel** (`Ctrl+Shift+M` / `Cmd+Shift+M`)
3. **See PT006 errors** for lines containing spaces in names

Try other rule files in `rules/` to see different validation errors:
- `pt001-root-marker.ptree` - Missing root marker
- `pt004-name-types.ptree` - NAME_TYPE mismatches
- `pt007-ext-lowercase.ptree` - Uppercase extensions

---

## 🔧 Test the Fixer (30 seconds)

1. **Open** `rules/pt007-ext-lowercase.ptree`
2. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **Run** `ptree: Fix Document`
4. **Watch** uppercase extensions get converted to lowercase!

> **Note:** Some fixes are applied automatically, others require manual intervention.

---

## 📊 Compare Profiles (30 seconds)

1. **Open** `profiles/default-profile.ptree`
2. **Note** the validation results (should be clean)
3. **Open** `profiles/spec-profile.ptree`
4. **Compare** - spec profile requires canonical headers

---

## 🖥️ Test CLI Commands

From the playground directory, run the test scripts:

```bash
# Validate a file
./scripts/test-validate.sh

# Generate a ptree from filesystem
./scripts/test-gen.sh

# Test the fixer
./scripts/test-fix.sh

# Preview fixes without applying
./scripts/test-diff.sh
```

Or run commands directly:

```bash
# Validate with JSON output
node ../bin/ptree.js validate demos/01-basic-tree.ptree --format json

# Generate from current directory
node ../bin/ptree.js gen . --style unicode --max-depth 2

# Fix a file (preview only)
node ../bin/ptree.js validate rules/pt007-ext-lowercase.ptree --fix

# Fix and write changes
node ../bin/ptree.js validate rules/pt007-ext-lowercase.ptree --fix --write
```

---

## 🎭 Customize Theme Colors

1. **Open** `.vscode/settings.json`
2. **Modify** the `editor.semanticTokenColorCustomizations` section
3. **Save** and see changes immediately in any open `.ptree` file

Example customization:
```json
"ptreeRoot": { "foreground": "#FF6B6B", "fontStyle": "bold" },
"ptreeDir": { "foreground": "#4ECDC4" },
"ptreeFile": { "foreground": "#95E1D3" }
```

---

## 📁 Explore Demo Files

| File | What It Shows |
|------|---------------|
| `demos/01-basic-tree.ptree` | Basic tree structure |
| `demos/02-name-types.ptree` | NAME_TYPE validation |
| `demos/03-roman-numerals.ptree` | Roman numeral prefixes |
| `demos/04-index-files.ptree` | (index) file convention |
| `demos/05-symlinks.ptree` | Symlink syntax |
| `demos/06-inline-metadata.ptree` | Attributes and comments |
| `demos/07-summary-lines.ptree` | Summary line format |
| `demos/08-all-features.ptree` | Everything combined |

---

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the `rules/` directory to understand each validation rule
- Check `config/` for configuration examples
- See `themes/all-tokens.ptree` for a file exercising all token types

Happy exploring! 🌳

# ptree Playground

A dedicated testing environment for exploring ptree syntax highlighting, validation, and all features in real-time.

## Purpose

This playground provides a pre-configured workspace where you can:

- **See syntax highlighting** in action with all semantic token types
- **Test validation rules** and see diagnostics in the Problems panel
- **Experiment with the fixer** to auto-correct common issues
- **Compare profiles** (default vs spec) and their validation differences
- **Test CLI commands** with ready-to-run scripts
- **Customize themes** with example semantic token color configurations

## Directory Structure

```
playground/
├── .vscode/           # VS Code settings for theme testing
├── demos/             # Feature demonstration files
│   ├── 01-basic-tree.ptree
│   ├── 02-name-types.ptree
│   ├── 03-roman-numerals.ptree
│   ├── 04-index-files.ptree
│   ├── 05-symlinks.ptree
│   ├── 06-inline-metadata.ptree
│   ├── 07-summary-lines.ptree
│   └── 08-all-features.ptree
├── profiles/          # Profile comparison files
│   ├── default-profile.ptree
│   ├── spec-profile.ptree
│   └── README.md
├── rules/             # Rule test files (PT001-PT015)
│   ├── pt001-root-marker.ptree
│   ├── pt002-dir-marker.ptree
│   └── ...
├── config/            # Configuration examples
│   ├── .ptreerc.json
│   ├── strict-config.ptree
│   └── relaxed-config.ptree
├── themes/            # Theme testing files
│   └── all-tokens.ptree
└── scripts/           # CLI test scripts
    ├── test-validate.sh
    ├── test-gen.sh
    ├── test-fix.sh
    └── test-diff.sh
```

## Features Demonstrated

| Feature | Demo File | Description |
|---------|-----------|-------------|
| Basic Tree | `demos/01-basic-tree.ptree` | Scaffold characters, directories, files |
| NAME_TYPE Validation | `demos/02-name-types.ptree` | ROOT, DIR, FILE naming patterns |
| Roman Numerals | `demos/03-roman-numerals.ptree` | NUMERAL prefix (I_, II_, III_) |
| Index Files | `demos/04-index-files.ptree` | (index) prefix convention |
| Symlinks | `demos/05-symlinks.ptree` | ` -> ` arrow syntax |
| Inline Metadata | `demos/06-inline-metadata.ptree` | [key=value] and # comments |
| Summary Lines | `demos/07-summary-lines.ptree` | "N directories, M files" format |
| All Features | `demos/08-all-features.ptree` | Comprehensive demo |

## Validation Rules

The `rules/` directory contains files that intentionally trigger each validation rule:

| Rule | File | Description |
|------|------|-------------|
| PT001 | `pt001-root-marker.ptree` | Root marker validation |
| PT002 | `pt002-dir-marker.ptree` | Directory marker validation |
| PT003 | `pt003-ptree-directive.ptree` | Missing @ptree directive |
| PT004 | `pt004-name-types.ptree` | NAME_TYPE mismatch |
| PT005 | `pt005-version-delimiter.ptree` | UniRule_1 violation |
| PT006 | `pt006-no-spaces.ptree` | Spaces in names |
| PT007 | `pt007-ext-lowercase.ptree` | Uppercase extension |
| PT008 | `pt008-mixed-delimiters.ptree` | UniRule_5 violation |
| PT009 | `pt009-sorting.ptree` | Sorting rule |

## Getting Started

See [QUICKSTART.md](QUICKSTART.md) for step-by-step instructions to get started in under 2 minutes.

## Theme Customization

The `.vscode/settings.json` file includes example semantic token color customizations for all 18 token types. Modify these to test your own theme colors.

## CLI Testing

The `scripts/` directory contains shell scripts demonstrating common CLI operations:

```bash
# Run from the playground directory
./scripts/test-validate.sh
./scripts/test-gen.sh
./scripts/test-fix.sh
./scripts/test-diff.sh
```

## Contributing

When adding new demo files:

1. Follow the naming convention: `NN-feature-name.ptree`
2. Include a header comment block explaining what the file demonstrates
3. Include both valid and invalid examples where appropriate
4. Update this README with the new file

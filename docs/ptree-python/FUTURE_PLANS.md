# FUTURE PLANS FOR PTREE

This document outlines the roadmap for ptree development, organized by priority.

---

## [HIGH-PRIORITY] v1.1.0 Target

### Language Server Protocol (LSP) Support

- Implement standalone LSP server for editor-agnostic support
- Enable ptree support in Neovim, Sublime Text, JetBrains IDEs
- Provide hover information for NAME_TYPEs and rules

### Tree Generation Improvements

- Add `--ignore` flag for excluding patterns (like `.gitignore`)
- Add `--include` flag for filtering to specific patterns
- Support generating trees from remote URLs (GitHub repos)
- Add `--template` option for custom output formats

### Validation Enhancements

- Add `--strict` mode that enables all rules
- Add `--fix-dry-run` to preview fixes without applying
- Support `.ptreeignore` files for excluding paths from validation
- Add rule explanations with `--explain PT001`

---

## [MED-PRIORITY] v1.2.0 Target

### IDE Integration

- Implement code lens for directory/file counts
- Add breadcrumb navigation support
- Implement go-to-definition for symlink targets
- Add workspace symbol provider for quick navigation

### Format Conversion

- Convert ptree to JSON tree structure
- Convert ptree to YAML tree structure
- Import from `tree` command output
- Export to Mermaid diagram format

### Configuration

- Add `ptree init` command to generate config files
- Support extending configs from npm packages
- Add config validation with helpful error messages
- Support environment variable interpolation in configs

---

## [LOW-PRIORITY] v1.3.0+ Target

### Advanced Features

- Support for tree diffing (compare two ptree files)
- Git integration (show changed files in tree)
- File size annotations
- Last modified date annotations
- Permission annotations (Unix-style)

### Documentation Generation

- Generate README.md from ptree with descriptions
- Generate directory index files
- Support for custom templates (Handlebars, EJS)

### Web Integration

- Standalone web viewer component
- GitHub Action for PR tree visualization
- npm package for rendering ptree in React/Vue

---

## [VERY-LOW-PRIORITY] Future Considerations

### Alternative Output Formats

- ASCII art variations
- HTML with collapsible sections
- SVG diagram generation
- PDF export

### Alternative Config Formats

> Skeleton TOML Config Example
```toml
[metadata]
title = "Directory Tree Structure"

[settings]
show_hidden = false
max_depth = 3
include_files = true
sort_order = "alphabetical"
output_format = "markdown"
include_symlinks = false
follow_symlinks = false
exclude_patterns = "*.tmp,*.log"
include_patterns = "*.md,*.ini"
color_scheme = "default"
indentation = "spaces"
indent_size = 4
line_prefix = "|-- "
line_suffix = ""
show_file_sizes = false
show_modification_dates = false

[advanced]
use_unicode_characters = true
collapse_empty_directories = true
custom_icons = false
icon_folder = "📁"
icon_file = "📄"
icon_symlink = "🔗"
icon_executable = "⚙️"
```

### Plugin System

- Support for custom NAME_TYPE validators
- Support for custom fixers
- Support for custom formatters
- Hook system for pre/post processing

---

## Completed Features (v1.0.0)

- ✅ Core parser with AST generation
- ✅ Validator with configurable rules (PT001-PT015)
- ✅ Fixer for automatic corrections
- ✅ Formatter for consistent output
- ✅ VS Code extension with semantic highlighting
- ✅ CLI with `gen` and `validate` commands
- ✅ NAME_TYPE registry with 11 built-in types
- ✅ Profile system (default, spec)
- ✅ Roman numeral prefix support (NUMERAL)
- ✅ Index file recognition ((index) prefix)
- ✅ Extension validation (EXT entity)
- ✅ META node support
- ✅ UniRules 1-6 implementation
- ✅ Parser round-trip support
- ✅ PT009 sorting rule
- ✅ JSON output format for CI/CD
- ✅ Symlink syntax support
- ✅ Inline metadata support
- ✅ Summary line recognition

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to propose new features or contribute to existing roadmap items.

# Design Document: Documentation-Implementation Alignment & User Quality of Life

## Overview

This design document outlines the technical approach for:
1. Aligning the `/docs/ptree-spec/` documentation with the actual ptree implementation
2. Creating a comprehensive testing playground environment for user quality of life

The design follows the existing project structure while adding a new `playground/` directory that serves as a self-contained testing environment for all ptree features.

## Architecture

The solution adds a new playground layer to the existing architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    User-Facing Layer                        │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  Documentation  │  │         Playground              │   │
│  │  (docs/)        │  │  (ptree-syntax/playground/)     │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    VS Code Extension                        │
│  (extension.ts, semanticTokens.ts, codeActions.ts, etc.)    │
├─────────────────────────────────────────────────────────────┤
│                         CLI                                 │
│                      (cli.ts)                               │
├─────────────────────────────────────────────────────────────┤
│                      Core Layer                             │
│   ┌──────────┐  ┌───────────┐  ┌────────┐  ┌───────────┐    │
│   │  Parser  │  │ Validator │  │ Fixer  │  │ Formatter │    │
│   └──────────┘  └───────────┘  └────────┘  └───────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Playground Directory Structure

```
ptree-syntax/playground/
├── .vscode/
│   ├── settings.json          # Semantic token color customizations
│   └── extensions.json        # Recommended extensions
├── QUICKSTART.md              # Step-by-step getting started guide
├── README.md                  # Playground overview and feature list
├── demos/
│   ├── 01-basic-tree.ptree           # Basic tree structure
│   ├── 02-name-types.ptree           # NAME_TYPE validation demo
│   ├── 03-roman-numerals.ptree       # NUMERAL prefix demo
│   ├── 04-index-files.ptree          # (index) prefix demo
│   ├── 05-symlinks.ptree             # Symlink syntax demo
│   ├── 06-inline-metadata.ptree      # Bracket attrs & comments
│   ├── 07-summary-lines.ptree        # Summary line demo
│   └── 08-all-features.ptree         # Comprehensive demo
├── profiles/
│   ├── default-profile.ptree         # Default profile example
│   └── spec-profile.ptree            # Spec profile example
├── rules/
│   ├── pt001-root-marker.ptree       # PT001 rule demo
│   ├── pt002-dir-marker.ptree        # PT002 rule demo
│   ├── pt003-ptree-directive.ptree   # PT003 rule demo
│   ├── pt004-name-types.ptree        # PT004 rule demo
│   ├── pt005-version-delimiter.ptree # PT005 rule demo
│   ├── pt006-no-spaces.ptree         # PT006 rule demo
│   ├── pt007-ext-lowercase.ptree     # PT007 rule demo
│   ├── pt008-mixed-delimiters.ptree  # PT008 rule demo
│   └── pt009-sorting.ptree           # PT009 rule demo
├── config/
│   ├── .ptreerc.json                 # Example user config
│   ├── strict-config.ptree           # Strict config demo
│   └── relaxed-config.ptree          # Relaxed config demo
├── themes/
│   └── all-tokens.ptree              # File exercising all token types
└── scripts/
    ├── test-validate.sh              # Validate command examples
    ├── test-gen.sh                   # Gen command examples
    ├── test-fix.sh                   # Fix command examples
    └── test-json-output.sh           # JSON output examples
```

## Components and Interfaces

### 1. Documentation Updates

**Location:** `docs/ptree-spec/`, `docs/ptree-python/`

#### 1.1 Path Corrections

Update `docs/ptree-spec/README.md` to fix broken links:

```markdown
# Before (broken)
1. [**01 — Vision and Goals**](ptree-training/01_VISION_AND_GOALS.md)

# After (fixed)
1. [**01 — Vision and Goals**](01_VISION_AND_GOALS.md)
```

#### 1.2 Canonical Header Updates

Update `docs/ptree-spec/00_PTREE.md` and `docs/ptree-python/SPEC.md`:

```ptree
@ptree: spec
@style: unicode
@version: 1.0.0
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type',
    EXT: 'smol-type',
    META: 'SCREAM_TYPE',
    NUMERAL: 'NUMERAL'
]
@separation_delimiters: [
    '-',
    '_',
    '.'
]
```

#### 1.3 Semantic Token Documentation

Update `docs/ptree-python/SEMANTIC_TOKENS.md` to include all 18 token types:

```typescript
// Complete token type list
const PTREE_SEMANTIC_TOKEN_TYPES = [
  'ptreeScaffold',
  'ptreeDirective',
  'ptreeDirectiveValue',
  'ptreeRoot',
  'ptreeDir',
  'ptreeFile',
  'ptreeExtension',
  'ptreeMeta',
  'ptreeSemver',
  'ptreeNameType',
  'ptreeNumeral',
  'ptreeIndex',
  'ptreeSymlink',
  'ptreeSymlinkArrow',
  'ptreeSymlinkTarget',
  'ptreeAttribute',
  'ptreeAttributeKey',
  'ptreeAttributeValue',
  'ptreeInlineComment'
];
```

### 2. Playground Environment

**Location:** `ptree-syntax/playground/`

#### 2.1 Quick Start Guide

```markdown
# QUICKSTART.md

## See Syntax Highlighting in 2 Minutes

1. Open this folder in VS Code
2. Open `demos/08-all-features.ptree`
3. You should see colorful syntax highlighting immediately!

## Test Validation

1. Open `rules/pt006-no-spaces.ptree`
2. Look at the Problems panel (Ctrl+Shift+M)
3. You'll see PT006 errors for lines with spaces

## Test the Fixer

1. Open any file with validation errors
2. Press Ctrl+Shift+P → "ptree: Fix Document"
3. Watch the errors get auto-fixed!
```

#### 2.2 Feature Demo Files

Each demo file follows this structure:

```ptree
# demos/03-roman-numerals.ptree
# ============================================
# DEMO: Roman Numeral Prefixes (NUMERAL)
# ============================================
# 
# Roman numerals (I, II, III, IV, V, etc.) can prefix
# directory names to create numbered sections.
# 
# Pattern: [NUMERAL]_[High_Type]
# Examples: I_Introduction/, II_Getting_Started/
# ============================================

@ptree: spec
@style: unicode
@version: 1.0.0
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type'
]

DOCS-1.0.0//
├── I_Introduction/
│   ├── (index).md
│   └── overview.md
├── II_Getting_Started/
│   ├── installation.md
│   └── quick-start.md
├── III_Core_Concepts/
│   ├── architecture.md
│   └── design-patterns.md
├── IV_Advanced_Topics/
│   └── performance.md
└── V_Reference/
    └── api.md
```

#### 2.3 Rule Test Files

Each rule test file demonstrates what triggers the rule:

```ptree
# rules/pt005-version-delimiter.ptree
# ============================================
# RULE TEST: PT005 - Version Delimiter Conflict
# ============================================
# 
# UniRule_1: Version delimiter must differ from
# the NAME_TYPE's word delimiter.
# 
# SCREAM_TYPE uses '_' as word delimiter,
# so version delimiter must be '-' (not '_')
# ============================================

@ptree: default
@style: unicode

# ✅ CORRECT: SCREAM_TYPE with '-' version delimiter
CORRECT_PROJECT-1.0.0//
├── readme.md
└── src/

# ❌ INCORRECT: SCREAM_TYPE with '_' version delimiter
# This should trigger PT005 error!
WRONG_PROJECT_1.0.0//
├── readme.md
└── src/
```

#### 2.4 VS Code Settings for Theme Testing

```json
// playground/.vscode/settings.json
{
  "editor.semanticHighlighting.enabled": true,
  "editor.semanticTokenColorCustomizations": {
    "rules": {
      "ptreeScaffold": { "foreground": "#6A737D" },
      "ptreeRoot": { "foreground": "#F97583", "fontStyle": "bold" },
      "ptreeDir": { "foreground": "#79B8FF" },
      "ptreeDir.nt_high_type": { "foreground": "#85E89D" },
      "ptreeFile": { "foreground": "#E1E4E8" },
      "ptreeFile.nt_smol_type": { "foreground": "#B392F0" },
      "ptreeExtension": { "foreground": "#FFAB70" },
      "ptreeNumeral": { "foreground": "#F9C513", "fontStyle": "bold" },
      "ptreeIndex": { "foreground": "#56D4DD", "fontStyle": "italic" },
      "ptreeSymlink": { "foreground": "#56D4DD", "fontStyle": "italic" },
      "ptreeSymlinkArrow": { "foreground": "#6A737D" },
      "ptreeSymlinkTarget": { "foreground": "#9ECBFF", "fontStyle": "italic" },
      "ptreeAttribute": { "foreground": "#79B8FF" },
      "ptreeAttributeKey": { "foreground": "#B392F0" },
      "ptreeAttributeValue": { "foreground": "#9ECBFF" },
      "ptreeInlineComment": { "foreground": "#6A737D", "fontStyle": "italic" },
      "ptreeDir.mismatch": { "foreground": "#F97583", "fontStyle": "underline" },
      "ptreeFile.mismatch": { "foreground": "#F97583", "fontStyle": "underline" },
      "ptreeSemver": { "foreground": "#79B8FF" },
      "ptreeMeta": { "foreground": "#6A737D" }
    }
  }
}
```

#### 2.5 CLI Test Scripts

```bash
#!/bin/bash
# scripts/test-validate.sh

echo "=== Testing ptree validate command ==="

echo ""
echo "1. Basic validation:"
node ../bin/ptree.js validate ../samples/example.ptree

echo ""
echo "2. JSON output format:"
node ../bin/ptree.js validate demos/01-basic-tree.ptree --format json

echo ""
echo "3. Show diff without applying:"
node ../bin/ptree.js validate rules/pt007-ext-lowercase.ptree --diff

echo ""
echo "4. Fix and show result:"
node ../bin/ptree.js validate rules/pt007-ext-lowercase.ptree --fix
```

### 3. Extension Development Setup

**Location:** `ptree-syntax/.vscode/`

#### 3.1 Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension with Playground",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "${workspaceFolder}/playground"
      ],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "npm: compile"
    },
    {
      "name": "Run Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
      ],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "npm: compile"
    }
  ]
}
```

## Data Models

### Playground File Metadata

Each playground file includes a header comment block with metadata:

```
# [filename].ptree
# ============================================
# [CATEGORY]: [Title]
# ============================================
# 
# [Description of what this file demonstrates]
# 
# [Additional notes, patterns, or examples]
# ============================================
```

### Demo File Categories

| Category | Purpose | Files |
|----------|---------|-------|
| demos/ | Feature demonstrations | 01-08 numbered files |
| profiles/ | Profile comparison | default-profile, spec-profile |
| rules/ | Rule testing | pt001-pt009 files |
| config/ | Configuration testing | .ptreerc.json, examples |
| themes/ | Theme testing | all-tokens.ptree |
| scripts/ | CLI testing | Shell scripts |



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Documentation Link Validity
*For any* markdown file in the docs/ directory, all internal links (relative paths) should point to files that exist in the repository.
**Validates: Requirements 1.3**

### Property 2: Semantic Token Documentation Completeness
*For any* semantic token type defined in the source code (semanticTokens.ts), there should be corresponding documentation in SEMANTIC_TOKENS.md.
**Validates: Requirements 4.1**

### Property 3: Profile Validation Difference
*For any* ptree document that is valid under the default profile, when validated under the spec profile with missing canonical headers, it should produce additional validation errors.
**Validates: Requirements 15.2**

### Property 4: Rule Test File Validation
*For any* rule test file in the playground/rules/ directory, running validation should produce at least one diagnostic with the expected rule code (PT001-PT015).
**Validates: Requirements 19.2**

## Error Handling

### Documentation Errors

1. **Broken Links**: Report file path and line number of broken link
2. **Missing Documentation**: Report which source code element lacks documentation
3. **Spelling Inconsistencies**: Report location and suggested correction

### Playground Errors

1. **Missing Demo Files**: Report which feature lacks demonstration
2. **Invalid Sample Files**: Report parse errors in playground files
3. **Script Execution Failures**: Report command and error output

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific examples and property-based tests for universal properties.

**Property-Based Testing Library:** fast-check (npm package)

### Unit Tests

Unit tests cover:
- Documentation link validity for specific files
- Presence of required playground files
- Correct structure of demo files
- Valid JSON in settings files

### Property-Based Tests

Each correctness property is implemented as a property-based test:

```typescript
// Example: Property 1 - Documentation Link Validity
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Documentation Link Validity', () => {
  it('**Feature: docs-implementation-alignment, Property 1: Documentation Link Validity**', () => {
    const markdownFiles = findMarkdownFiles('docs/');
    
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const links = extractInternalLinks(content);
      
      for (const link of links) {
        const targetPath = path.resolve(path.dirname(file), link);
        expect(fs.existsSync(targetPath)).toBe(true);
      }
    }
  });
});
```

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with feature name and property number
- Tests validate both documentation and playground files

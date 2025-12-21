# Requirements Document

## Introduction

This specification addresses two major areas:

1. **Documentation-Implementation Alignment**: Gaps between the `/docs/ptree-spec/` documentation suite and the actual ptree implementation
2. **User Quality of Life**: A comprehensive testing and development environment that allows users to experience syntax highlighting, linting, and all ptree features in real-time

After a comprehensive cross-reference review, several documentation inconsistencies have been identified. Additionally, users need a streamlined way to test and validate ptree features without complex setup procedures.

The goal is to ensure the documentation accurately reflects the current implementation state, provides clear guidance for users and contributors, and delivers an excellent developer experience through a dedicated testing environment.

## Glossary

- **ptree**: The Pretty Tree format - a standardized, human-friendly syntax for representing directory trees
- **ptree-spec**: The specification documentation suite in `/docs/ptree-spec/`
- **ptree-python**: The implementation documentation in `/docs/ptree-python/`
- **NAME_TYPE**: A naming convention pattern used to classify and validate entity names
- **Entity**: A classified element in the tree: ROOT, DIR, FILE, EXT, or META
- **Profile**: A configuration preset (default or spec) that determines validation strictness
- **UniRule**: Universal rules that apply across all NAME_TYPEs
- **Directive**: A metadata line starting with `@` that provides configuration or context
- **Extension Development Host**: VS Code's mechanism for testing extensions in an isolated environment
- **Playground**: A dedicated workspace with sample files for testing ptree features
- **Live Preview**: Real-time syntax highlighting and validation feedback as users edit ptree files

## Requirements

### Requirement 1: Documentation Path Corrections

**User Story:** As a documentation reader, I want all internal links to work correctly, so that I can navigate the documentation without encountering broken references.

#### Acceptance Criteria

1. WHEN a user clicks a link in docs/ptree-spec/README.md THEN the system SHALL navigate to the correct file path
2. WHEN the README.md references "ptree-training" folder THEN the system SHALL update references to use correct relative paths within docs/ptree-spec/
3. WHEN documentation references external files THEN the system SHALL verify the referenced files exist

### Requirement 2: Canonical Header Documentation Alignment

**User Story:** As a user reading the spec documentation, I want the canonical header examples to match the actual implementation, so that I can correctly configure my ptree documents.

#### Acceptance Criteria

1. WHEN the docs/ptree-spec/00_PTREE.md shows a canonical header THEN the system SHALL include EXT, META, and NUMERAL entity mappings matching the implementation
2. WHEN the docs/ptree-python/SPEC.md shows entity types THEN the system SHALL document all six entities (ROOT, DIR, FILE, EXT, META, NUMERAL)
3. WHEN documentation shows @name_type directive THEN the system SHALL use the correct spelling "separation_delimiters" (not "seperation_delimiters")

### Requirement 3: UniRule Documentation Completeness

**User Story:** As a user learning ptree naming conventions, I want all UniRules documented with examples, so that I can understand and follow the naming rules.

#### Acceptance Criteria

1. WHEN a user reads GRAMMAR.md THEN the system SHALL find UniRule_1 through UniRule_6 fully documented
2. WHEN UniRule documentation is displayed THEN the system SHALL include the corresponding rule ID (PT001-PT015)
3. WHEN UniRule examples are shown THEN the system SHALL provide both correct and incorrect examples with explanations

### Requirement 4: Semantic Token Documentation Updates

**User Story:** As a theme developer, I want complete semantic token documentation, so that I can customize ptree highlighting in my editor theme.

#### Acceptance Criteria

1. WHEN a user reads SEMANTIC_TOKENS.md THEN the system SHALL find documentation for all 18 token types including ptreeAttribute, ptreeAttributeKey, ptreeAttributeValue, ptreeInlineComment
2. WHEN token modifiers are documented THEN the system SHALL include nt_index_type and nt_numeral modifiers
3. WHEN theme customization examples are shown THEN the system SHALL include examples for all new token types

### Requirement 5: Sample File Updates

**User Story:** As a user learning ptree, I want sample files that demonstrate all features, so that I can understand the format through examples.

#### Acceptance Criteria

1. WHEN a user views samples/example.ptree THEN the system SHALL see a comprehensive example demonstrating all core features
2. WHEN samples demonstrate inline metadata THEN the system SHALL show both bracket attributes and inline comments
3. WHEN samples demonstrate symlinks THEN the system SHALL show the ` -> ` arrow syntax with both file and directory targets

### Requirement 6: CLI Documentation Updates

**User Story:** As a CLI user, I want accurate documentation of all CLI options, so that I can use the tool effectively.

#### Acceptance Criteria

1. WHEN a user reads CLI documentation THEN the system SHALL find --format json option documented
2. WHEN a user reads CLI documentation THEN the system SHALL find --diff option documented
3. WHEN a user reads CLI documentation THEN the system SHALL find --name-type option documented with available NAME_TYPEs

### Requirement 7: Configuration Schema Documentation

**User Story:** As a user creating custom configs, I want documentation of the configuration schema, so that I can create valid configuration files.

#### Acceptance Criteria

1. WHEN a user reads configuration documentation THEN the system SHALL find EXT and NUMERAL entities documented in ENTITY_NAME_TYPES
2. WHEN a user reads configuration documentation THEN the system SHALL find FILE_EXTENSION_SPLIT option documented with firstDot and lastDot strategies
3. WHEN a user reads configuration documentation THEN the system SHALL find all rule IDs (PT001-PT015) documented with their purposes

### Requirement 8: Index File Documentation

**User Story:** As a user organizing documentation trees, I want index file conventions documented, so that I can use the (index) prefix correctly.

#### Acceptance Criteria

1. WHEN a user reads GRAMMAR.md THEN the system SHALL find index-type NAME_TYPE documented with pattern and examples
2. WHEN index file documentation is shown THEN the system SHALL explain the (index) prefix convention and its purpose
3. WHEN index file examples are provided THEN the system SHALL show (index), (index)-name, and (index)_name patterns

### Requirement 9: Symlink Documentation

**User Story:** As a user documenting directory structures with symlinks, I want symlink syntax documented, so that I can represent symbolic links correctly.

#### Acceptance Criteria

1. WHEN a user reads SPEC.md THEN the system SHALL find symlink syntax ` -> ` documented
2. WHEN symlink documentation is shown THEN the system SHALL explain validation rules for symlink names
3. WHEN symlink examples are provided THEN the system SHALL show both file and directory symlink targets

### Requirement 10: Inline Metadata Documentation

**User Story:** As a user adding annotations to tree nodes, I want inline metadata syntax documented, so that I can add context without breaking the tree structure.

#### Acceptance Criteria

1. WHEN a user reads SPEC.md THEN the system SHALL find bracket attribute syntax `[key=value]` documented
2. WHEN a user reads SPEC.md THEN the system SHALL find inline comment syntax `# comment` documented
3. WHEN inline metadata documentation is shown THEN the system SHALL explain the two-space delimiter requirement

### Requirement 11: Summary Line Documentation

**User Story:** As a user generating trees from filesystem tools, I want summary line format documented, so that I understand how tree command output is handled.

#### Acceptance Criteria

1. WHEN a user reads SPEC.md THEN the system SHALL find summary line pattern `N directories, M files` documented
2. WHEN summary line documentation is shown THEN the system SHALL explain that summary lines are treated as metadata

### Requirement 12: Error Handling Documentation

**User Story:** As a user troubleshooting ptree issues, I want error handling behavior documented, so that I can understand and resolve validation errors.

#### Acceptance Criteria

1. WHEN a user reads documentation THEN the system SHALL find all rule IDs (PT000-PT015) documented with their error messages
2. WHEN error documentation is shown THEN the system SHALL explain error recovery behavior for malformed input
3. WHEN configuration errors are documented THEN the system SHALL explain JSON parse error reporting with file path and position



### Requirement 13: Testing Playground Environment

**User Story:** As a user learning ptree, I want a dedicated playground environment, so that I can experiment with syntax highlighting and validation in real-time without affecting my actual projects.

#### Acceptance Criteria

1. WHEN a user opens the playground folder THEN the system SHALL provide a pre-configured workspace with sample ptree files demonstrating all features
2. WHEN a user edits a playground ptree file THEN the system SHALL display real-time syntax highlighting with all semantic token types visible
3. WHEN a user saves a playground ptree file THEN the system SHALL immediately show validation diagnostics in the Problems panel
4. WHEN a user opens the playground THEN the system SHALL include a README explaining how to use the playground and what features to test

### Requirement 14: Feature Demonstration Files

**User Story:** As a user exploring ptree capabilities, I want demonstration files for each feature, so that I can see how each feature works in isolation.

#### Acceptance Criteria

1. WHEN a user views the playground THEN the system SHALL provide separate demo files for: basic tree structure, NAME_TYPE validation, Roman numeral prefixes, index files, symlinks, inline metadata, and summary lines
2. WHEN a user views a demo file THEN the system SHALL include inline comments explaining what the file demonstrates
3. WHEN a user views a demo file THEN the system SHALL include both valid and intentionally invalid examples to show validation behavior

### Requirement 15: Profile Comparison Environment

**User Story:** As a user understanding profile differences, I want side-by-side profile comparison files, so that I can see how default and spec profiles differ in validation behavior.

#### Acceptance Criteria

1. WHEN a user views the playground THEN the system SHALL provide matching files for default and spec profiles
2. WHEN a user compares profile files THEN the system SHALL see different validation results based on profile strictness
3. WHEN a user views profile comparison THEN the system SHALL include documentation explaining the differences

### Requirement 16: Theme Testing Support

**User Story:** As a theme developer, I want to test semantic token colors, so that I can customize ptree highlighting for my theme.

#### Acceptance Criteria

1. WHEN a user opens the playground THEN the system SHALL provide a settings.json with example semantic token color customizations
2. WHEN a user modifies semantic token colors THEN the system SHALL see changes reflected immediately in the playground files
3. WHEN a user tests themes THEN the system SHALL provide a file that exercises all semantic token types for comprehensive theme testing

### Requirement 17: CLI Testing Scripts

**User Story:** As a CLI user, I want ready-to-run test scripts, so that I can quickly test CLI commands without memorizing syntax.

#### Acceptance Criteria

1. WHEN a user opens the playground THEN the system SHALL provide shell scripts demonstrating common CLI operations
2. WHEN a user runs a test script THEN the system SHALL see example output for validate, gen, and fix commands
3. WHEN a user runs a test script THEN the system SHALL include scripts for --format json, --diff, and --name-type options

### Requirement 18: Quick Start Guide

**User Story:** As a new user, I want a quick start guide in the playground, so that I can begin testing features immediately.

#### Acceptance Criteria

1. WHEN a user opens the playground THEN the system SHALL display a QUICKSTART.md file with step-by-step instructions
2. WHEN a user follows the quick start THEN the system SHALL be able to see syntax highlighting within 2 minutes
3. WHEN a user follows the quick start THEN the system SHALL understand how to trigger validation and see diagnostics

### Requirement 19: Validation Rule Testing

**User Story:** As a user understanding validation rules, I want files that trigger each validation rule, so that I can see what each rule checks.

#### Acceptance Criteria

1. WHEN a user views the playground THEN the system SHALL provide files that intentionally trigger each rule PT001-PT015
2. WHEN a user views a rule test file THEN the system SHALL see the expected diagnostic message in the Problems panel
3. WHEN a user views a rule test file THEN the system SHALL include comments explaining what rule is being tested and why it triggers

### Requirement 20: Configuration Testing

**User Story:** As a user customizing ptree behavior, I want to test configuration changes, so that I can understand how config affects validation.

#### Acceptance Criteria

1. WHEN a user opens the playground THEN the system SHALL provide example .ptreerc.json files with different configurations
2. WHEN a user modifies a config file THEN the system SHALL see validation behavior change in real-time
3. WHEN a user tests configuration THEN the system SHALL include examples of enabling/disabling rules and changing NAME_TYPE mappings

### Requirement 21: Extension Development Setup

**User Story:** As a contributor, I want a streamlined development setup, so that I can test extension changes quickly.

#### Acceptance Criteria

1. WHEN a contributor opens the project THEN the system SHALL provide VS Code launch configurations for debugging the extension
2. WHEN a contributor presses F5 THEN the system SHALL launch an Extension Development Host with the playground pre-loaded
3. WHEN a contributor makes code changes THEN the system SHALL be able to reload the extension and see changes without restarting VS Code

### Requirement 22: Automated Test Runner Integration

**User Story:** As a contributor, I want to run tests easily, so that I can verify my changes don't break existing functionality.

#### Acceptance Criteria

1. WHEN a contributor opens the project THEN the system SHALL provide npm scripts for running all test types
2. WHEN a contributor runs tests THEN the system SHALL see clear output indicating which tests passed or failed
3. WHEN a contributor runs property-based tests THEN the system SHALL see the number of iterations and any failing examples

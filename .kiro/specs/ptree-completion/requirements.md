# Requirements Document

## Introduction

This specification defines the requirements for completing the ptree (Pretty Tree) project to achieve full scope as a standardized, human-friendly directory tree format. The primary goal is to establish ptree as the standard syntax for directory trees in documentation, particularly as a replacement for unmarked code blocks in Markdown (```ptree instead of blank ```).

The project currently implements core functionality (parser, validator, fixer, formatter, VS Code extension, CLI) but has gaps in the NAME_TYPE registry, entity handling, and grammar completeness that prevent it from being a complete standard. The current implementation (v0.0.5) must be completed to match the original design specification before adding auxiliary tooling.

**Primary Goal:** Complete the ptree language specification and implementation to production-ready v1.0.0 status.

**End Goal:** Adoption as a recognized syntax standard for directory trees in Markdown and documentation tools.

## Glossary

- **ptree**: The Pretty Tree format - a standardized, human-friendly syntax for representing directory trees
- **NAME_TYPE**: A naming convention pattern (e.g., SCREAM_TYPE, smol-type, High_Type) used to classify and validate entity names
- **Entity**: A classified element in the tree: ROOT, DIR, FILE, EXT, or META
- **ROOT**: The tree's root label, ending with `//`, following SCREAM_TYPE naming
- **DIR**: A directory node, ending with `/`, with configurable NAME_TYPE
- **FILE**: A file node with optional extension, with configurable NAME_TYPE for the stem
- **EXT**: File extension, a first-class entity with its own validation rules
- **META**: Metadata nodes ending with `//`, used for structural markers
- **NUMERAL**: Roman numeral prefix support for numbered sections (I_, II_, III_, IV_, etc.)
- **Directive**: A metadata line starting with `@` that provides configuration or context
- **Profile**: A configuration preset (default or spec) that determines validation strictness
- **Scaffold**: The tree-drawing characters (│, ├──, └──) that visualize hierarchy
- **SEPARATION_DELIMITER**: Characters used to separate words within names (`-`, `_`, `.`)
- **VERSION_DELIMITER**: Character used to append version to a name (must differ from word delimiter)
- **SEMVER**: Semantic versioning format (MAJOR.MINOR.PATCH)
- **UniRule**: Universal rules that apply across all NAME_TYPEs
- **Index File**: A file with `(index)` prefix that serves as the main entry for a directory
- **Symlink**: A symbolic link represented with ` -> ` arrow syntax pointing to a target path
- **Inline Metadata**: Annotations added after node names, including bracket attributes `[key=value]` and inline comments `# comment`
- **Summary Line**: A line like `N directories, M files` typically appended by tree generators
- **Bracket Block**: Multi-line directive syntax using `@key:[...]` for structured values
- **Stem**: The base name of a file before the extension (e.g., `parser` in `parser.test.ts`)
- **firstDot Strategy**: Extension splitting where stem is before first dot (spec profile default)
- **lastDot Strategy**: Extension splitting where stem is before last dot (default profile)

## Requirements

### Requirement 1: Complete NAME_TYPE Registry

**User Story:** As a user creating directory trees, I want all standard naming conventions supported, so that I can represent real-world file structures accurately.

#### Acceptance Criteria

1. WHEN a directory uses Roman numeral prefixes (I_, II_, III_) THEN the system SHALL recognize and validate the NUMERAL NAME_TYPE pattern `^[IVXLCDM]+$`
2. WHEN a user configures NAME_TYPEs THEN the system SHALL support all defined types: SCREAM_TYPE, High_Type, Cap-Type, CamelType, smol-type, snake_type, dotfile, dotdir, dot.smol-type, and NUMERAL
3. WHEN a NAME_TYPE uses a word delimiter THEN the system SHALL enforce that the version delimiter differs from the word delimiter (UniRule_1)
4. WHEN a user defines custom NAME_TYPEs in config THEN the system SHALL merge them with built-in types and validate accordingly
5. WHEN validating a name THEN the system SHALL check against the pattern, word_delimiter, and allowed_version_delimiters defined for that NAME_TYPE

### Requirement 2: EXT (Extension) Entity Support

**User Story:** As a user enforcing file naming standards, I want extensions treated as first-class entities, so that I can configure and validate them independently.

#### Acceptance Criteria

1. WHEN a file has an extension THEN the system SHALL parse and validate the extension as a separate EXT entity
2. WHEN the @name_type directive includes EXT THEN the system SHALL apply the specified NAME_TYPE rules to file extensions
3. WHEN an extension contains uppercase characters THEN the system SHALL report PT007 with the specific extension highlighted
4. WHEN a file has multiple extensions (e.g., .tar.gz) THEN the system SHALL validate each extension segment according to EXT rules
5. WHEN EXT is not specified in config THEN the system SHALL default to lowercase validation (smol-type pattern)

### Requirement 3: META Entity and Index File Support

**User Story:** As a user organizing documentation trees, I want META nodes and index file conventions, so that I can create structured documentation hierarchies.

#### Acceptance Criteria

1. WHEN a node name ends with `//` THEN the system SHALL classify it as a META entity and validate against META NAME_TYPE rules
2. WHEN a file name starts with `(index)` THEN the system SHALL recognize it as an index file and apply appropriate validation
3. WHEN the @name_type directive includes META THEN the system SHALL apply the specified NAME_TYPE rules to meta nodes
4. WHEN a META node appears in the tree THEN the system SHALL highlight it distinctly from DIR and FILE nodes
5. WHEN validating index files THEN the system SHALL allow the `(index)` prefix followed by standard FILE naming rules

### Requirement 4: NUMERAL (Roman Numeral) Support

**User Story:** As a user creating numbered documentation sections, I want Roman numeral prefix support, so that I can organize chapters and sections naturally.

#### Acceptance Criteria

1. WHEN a directory name starts with a Roman numeral followed by underscore (e.g., I_, II_, III_) THEN the system SHALL recognize the NUMERAL pattern
2. WHEN the @name_type directive includes NUMERAL THEN the system SHALL validate Roman numeral prefixes in directory names
3. WHEN a Roman numeral prefix is used THEN the system SHALL validate the remainder of the name against the DIR NAME_TYPE
4. WHEN highlighting a NUMERAL-prefixed directory THEN the system SHALL apply distinct styling to the numeral portion
5. WHEN validating Roman numerals THEN the system SHALL accept standard numerals I through M (1-1000)

### Requirement 5: Complete Directive Support

**User Story:** As a user configuring ptree documents, I want all directives fully implemented, so that I can control validation and formatting behavior.

#### Acceptance Criteria

1. WHEN a document includes @version directive THEN the system SHALL parse and validate it as SEMVER format
2. WHEN a document includes @name_type block THEN the system SHALL parse ROOT, DIR, FILE, EXT, META, and NUMERAL mappings
3. WHEN a document includes @separation_delimiters THEN the system SHALL use the specified delimiters for validation
4. WHEN a document includes @root directive THEN the system SHALL use it as the filesystem path prefix for copy-path commands
5. WHEN a document includes @style directive THEN the system SHALL enforce unicode or ascii scaffold characters accordingly

### Requirement 6: UniRule Implementation

**User Story:** As a user following naming conventions, I want universal rules enforced, so that I can avoid ambiguous name patterns.

#### Acceptance Criteria

1. WHEN a NAME_TYPE uses `_` as word delimiter THEN the system SHALL require `-` as version delimiter (UniRule_1)
2. WHEN a NAME_TYPE uses `-` as word delimiter THEN the system SHALL require `_` as version delimiter (UniRule_1)
3. WHEN a NAME_TYPE has no word delimiter (CamelType) THEN the system SHALL allow both `-` and `_` as version delimiters
4. WHEN a name violates UniRule_1 THEN the system SHALL report PT005 with a clear explanation of the conflict
5. WHEN validating names THEN the system SHALL check that `-` and `_` are not mixed within the same bare name (UniRule_5)

### Requirement 7: Parser Round-Trip Support

**User Story:** As a tool developer, I want to parse and regenerate ptree documents, so that I can build transformations that preserve formatting.

#### Acceptance Criteria

1. WHEN the parser processes a valid ptree document THEN the system SHALL produce an AST that can be serialized back to identical text
2. WHEN the parser encounters whitespace and comments THEN the system SHALL preserve their positions in the AST for round-trip fidelity
3. WHEN a pretty-printer serializes an AST THEN the system SHALL produce valid ptree text that re-parses to an equivalent AST

### Requirement 8: Sorting Rule Enforcement (PT009)

**User Story:** As a user wanting consistent tree ordering, I want PT009 sorting to be reliable, so that I can enforce directory-first, alphabetical ordering.

#### Acceptance Criteria

1. WHEN PT009 is enabled THEN the system SHALL report violations where directories appear after files at the same level
2. WHEN PT009 is enabled THEN the system SHALL report violations where siblings are not alphabetically ordered within their group
3. WHEN the fixer runs with PT009 enabled THEN the system SHALL reorder nodes to satisfy the sorting rule
4. WHEN the formatter runs THEN the system SHALL sort nodes according to PT009 rules by default

### Requirement 9: Error Recovery and Resilience

**User Story:** As a user editing ptree files, I want graceful error handling, so that I can get useful feedback even with malformed input.

#### Acceptance Criteria

1. WHEN the parser encounters an invalid line THEN the system SHALL continue parsing subsequent lines and collect all errors
2. WHEN the parser encounters unclosed bracket blocks THEN the system SHALL report the error with the opening line location
3. WHEN the validator encounters an unknown directive THEN the system SHALL emit an info-level message without blocking validation
4. WHEN the config loader encounters invalid JSON THEN the system SHALL report the parse error with file path and position

### Requirement 10: Documentation Completion

**User Story:** As a developer adopting ptree, I want comprehensive documentation, so that I can understand and use all features without guessing.

#### Acceptance Criteria

1. WHEN a user accesses the docs folder THEN the system SHALL provide complete SEMANTIC_TOKENS.md documenting all token types and theme customization
2. WHEN a user reads GRAMMAR.md THEN the system SHALL find all NAME_TYPEs, UniRules, and entity definitions fully documented
3. WHEN a user reads FUTURE_PLANS.md THEN the system SHALL display a prioritized roadmap of planned features
4. WHEN a user wants to contribute THEN the system SHALL provide a CONTRIBUTING.md file with development guidelines
5. WHEN a user reads SPEC.md THEN the system SHALL find the canonical header example including EXT, META, and NUMERAL entity mappings
6. WHEN a user reads GRAMMAR.md THEN the system SHALL find NUMERAL NAME_TYPE with pattern, examples, and usage rules documented
7. WHEN a user reads GRAMMAR.md THEN the system SHALL find index-type NAME_TYPE with `(index)` prefix pattern documented
8. WHEN a user reads GRAMMAR.md THEN the system SHALL find all six UniRules (UR1-UR6) fully documented with examples

### Requirement 11: CLI Enhancements

**User Story:** As a CI/CD pipeline operator, I want machine-readable output, so that I can integrate ptree validation into automated workflows.

#### Acceptance Criteria

1. WHEN a user runs validate with --format json THEN the system SHALL output validation results as JSON with file, line, column, code, severity, and message fields
2. WHEN a user runs validate with --diff THEN the system SHALL show a unified diff of proposed fixes without applying them
3. WHEN a user runs gen with custom @name_type THEN the system SHALL apply the specified naming conventions to generated output

### Requirement 12: Configuration Schema Validation

**User Story:** As a user creating custom configs, I want schema validation, so that I can catch config errors before runtime.

#### Acceptance Criteria

1. WHEN a user edits a ptree config file THEN the system SHALL validate against the JSON schema and report errors
2. WHEN a config file references an unknown NAME_TYPE THEN the system SHALL report the error with the invalid reference
3. WHEN a config file has invalid rule settings THEN the system SHALL report which rule and what is invalid
4. WHEN the schema is updated THEN the system SHALL maintain backward compatibility with existing valid configs

### Requirement 13: Semantic Token Completeness

**User Story:** As a user wanting rich syntax highlighting, I want all entities to have distinct semantic tokens, so that themes can style them appropriately.

#### Acceptance Criteria

1. WHEN highlighting a NUMERAL prefix THEN the system SHALL emit a distinct semantic token type for Roman numerals
2. WHEN highlighting an EXT THEN the system SHALL emit ptreeExtension token with NAME_TYPE modifier
3. WHEN highlighting a META node THEN the system SHALL emit ptreeMeta token with appropriate NAME_TYPE modifier
4. WHEN highlighting an index file THEN the system SHALL emit distinct tokens for the `(index)` prefix and the filename
5. WHEN highlighting a symlink THEN the system SHALL emit distinct tokens for the name, arrow, and target
6. WHEN highlighting inline metadata THEN the system SHALL emit distinct tokens for bracket attributes and inline comments

### Requirement 14: Sample and Example Updates

**User Story:** As a user learning ptree, I want relevant examples, so that I can understand the format without confusion.

#### Acceptance Criteria

1. WHEN a user views samples/example.ptree THEN the system SHALL display a generic, non-project-specific example tree
2. WHEN documentation shows examples THEN the system SHALL use placeholder names like "Project_Name", "module-name", "config.json"
3. WHEN examples demonstrate NUMERAL support THEN the system SHALL show Roman numeral prefixed directories (I_Introduction/, II_Content/)
4. WHEN examples demonstrate META nodes THEN the system SHALL show proper `//` suffix usage

### Requirement 15: Property-Based Testing

**User Story:** As a maintainer, I want property-based tests, so that I can ensure correctness across edge cases.

#### Acceptance Criteria

1. WHEN running the test suite THEN the system SHALL execute property-based tests for parser round-trip consistency
2. WHEN running the test suite THEN the system SHALL execute property-based tests verifying that valid NAME_TYPE patterns match their examples
3. WHEN running the test suite THEN the system SHALL execute property-based tests ensuring validator rules are deterministic
4. WHEN running the test suite THEN the system SHALL execute property-based tests confirming fixer idempotence

### Requirement 16: Symlink Support

**User Story:** As a user documenting directory structures with symlinks, I want symlinks properly parsed and displayed, so that I can accurately represent filesystem relationships.

#### Acceptance Criteria

1. WHEN a node contains ` -> ` arrow syntax THEN the system SHALL parse it as a symlink with name and target
2. WHEN validating a symlink THEN the system SHALL validate the name portion against the appropriate NAME_TYPE rules
3. WHEN highlighting a symlink THEN the system SHALL emit distinct tokens for the name, arrow operator, and target path
4. WHEN the symlink target ends with `/` THEN the system SHALL recognize it as pointing to a directory

### Requirement 17: Inline Metadata Support

**User Story:** As a user adding annotations to tree nodes, I want inline metadata support, so that I can add context without breaking the tree structure.

#### Acceptance Criteria

1. WHEN a node has two or more spaces followed by `[key=value]` THEN the system SHALL parse it as bracket attributes
2. WHEN a node has two or more spaces followed by `#` THEN the system SHALL parse it as an inline comment
3. WHEN highlighting inline metadata THEN the system SHALL emit distinct tokens for attributes and comments
4. WHEN validating a node with inline metadata THEN the system SHALL validate only the name portion against NAME_TYPE rules

### Requirement 18: Summary Line Support

**User Story:** As a user generating trees from filesystem tools, I want summary lines recognized, so that output from `tree` command is compatible.

#### Acceptance Criteria

1. WHEN a line matches the pattern `N directories, M files` THEN the system SHALL recognize it as a summary line
2. WHEN parsing a summary line THEN the system SHALL treat it as metadata without affecting tree structure
3. WHEN highlighting a summary line THEN the system SHALL emit ptreeMeta token type

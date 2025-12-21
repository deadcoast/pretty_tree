# Glossary

This glossary defines PTREE terms in plain language.

- **PTREE**: A standardized text format for representing directory trees.
- **Document**: A PTREE file or fenced PTREE block containing a header and tree body.
- **Tree body**: The lines that visually represent hierarchy.
- **Scaffold**: The branch/connector characters that draw the tree.
- **Node**: A single entry in the tree body (directory, file, or meta marker).
- **Root identity**: A human label for “what this tree represents” (often canonical in strict profiles).
- **Root path**: A filesystem location used to generate or resolve paths.
- **Profile**: A named ruleset (e.g. “default”, “spec”) defining conventions and strictness.
- **Rule**: A convention that can be enabled/disabled and given severity (info/warn/error).
- **NAME_TYPES**: A registry of naming style categories used for consistent authoring, highlighting, and linting.
- **Canonical**: A representation intended to be stable, publishable, and validated under a strict profile.
- **Truncation**: Intentionally omitting parts of a tree for readability.

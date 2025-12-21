# 01 — Vision and Goals

PTREE is designed to make directory trees **clear, comparable, and portable**.

## Core Vision

PTREE defines a directory tree representation that is:

- **Human-first**: optimized for scanning and comprehension
- **Tool-friendly**: structured enough to parse consistently
- **Documentation-native**: works inside Markdown and docs without friction
- **Diff-stable**: produces minimal noise in Git diffs
- **Configurable**: teams can apply consistent naming and formatting rules
- **Extensible**: new capabilities can be added without breaking old documents

PTREE aims to become the **“default language”** for directory trees in technical communication.

---

## Goals

### G1 — Visual clarity
A reader should instantly distinguish:
- directories vs files
- hierarchy depth
- sibling group boundaries
- “important” names (root, sections, special directories)

PTREE chooses conventions that support visual scanning.

### G2 — Determinism and stability
The same logical tree should render the same way across tools and time.

This matters for:
- code review,
- documentation versioning,
- reproducible build artifacts,
- AI prompt reuse.

### G3 — Editor empowerment
PTREE is designed so editors can offer:
- folding/collapsing sections,
- semantic highlighting,
- navigation and selection,
- lint diagnostics and fix suggestions.

The PTREE spec is not “just text output”; it is a **language for describing structure**.

### G4 — Markdown-first embedding
PTREE should be easily embedded in Markdown and rendered consistently.

Markdown is the universal medium for developer communication. PTREE must fit it naturally.

### G5 — “Lint-style” standardization
PTREE supports an opinionated default ruleset and an overrideable config model.

This enables:
- consistent naming across repos,
- automated checks in CI,
- shared conventions across organizations.

### G6 — Compatibility with common tree conventions
PTREE intentionally aligns with established tree visuals (Unicode/ASCII).

It should feel familiar to anyone who has seen `tree` output.

---

## Non-Goals

### NG1 — PTREE is not a filesystem metadata snapshot
PTREE is not a complete file inventory database.
It does not aim to capture:
- file hashes
- ownership/permissions
- timestamps
- full sizes for every file
- symlink targets as a mandatory requirement

Optional metadata can exist, but PTREE stays focused on structure and naming.

### NG2 — PTREE is not a package manifest
It does not replace:
- `package.json`
- `pyproject.toml`
- `Cargo.toml`
- etc.

PTREE describes structure; package manifests describe dependencies and build intent.

### NG3 — PTREE is not a graph format
PTREE is a tree, not a DAG.
It does not represent:
- shared nodes,
- cyclic references,
- dependency edges.

### NG4 — PTREE is not “whatever the tool outputs”
PTREE is a standard. Tools may generate PTREE, but PTREE is not defined by any one tool.

---

## The “why” in one sentence

PTREE exists so developers can share directory structures with the same confidence and consistency that they share Markdown.

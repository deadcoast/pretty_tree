# ptree Specification v1.0 (Draft)

`ptree` ("pretty tree") is a **plain-text, standardized format** for representing directory trees.

It is designed to be:

- **Human-scannable** (visually structured, theme-friendly highlighting)
- **Copy/paste friendly** (stable characters and alignment)
- **Toolable** (parsers can reliably infer depth and paths)
- **Markdown-first** (works well in fenced code blocks)

This spec describes the **format**, not a particular editor integration.

---

## 1. Document Basics

## Canonical Profile Header (`@ptree: spec`)

A document that claims the canonical profile starts with:

```ptree
@ptree: spec
@style: unicode
@version: 0.0.2
@name_type:[
  ROOT: 'SCREAM_TYPE',
  DIR: 'High_Type',
  FILE: 'smol-type'
]
@seperation_delimiters: [
  '-',
  '_',
  '.'
]

PTREE-0.0.2//
...
```

Tooling may use this header to select the ruleset and validate that the tree is canonical.

### 1.1 Encoding

- A ptree document **MUST** be UTF-8.
- Line endings **MAY** be `\n` (LF) or `\r\n` (CRLF).

### 1.2 Whitespace

- Indentation and connectors are part of the format.
- Node names **MAY** contain spaces.
- Trailing spaces are discouraged; parsers **SHOULD** ignore trailing spaces.

---

## 2. Line Types

A ptree document is a sequence of lines. Each line is one of:

1. **Blank line**
2. **Comment line**
3. **Directive line**
4. **Root line**
5. **Node line**
6. **Optional summary line**

### 2.1 Comment line

- A comment line **MUST** start with optional whitespace followed by `#`.

Example:

```ptree
# This tree is for the docs website
```

### Multi-line directive blocks (canonical headers)

`ptree` also supports **bracket blocks** for directives that declare structured values (similar in spirit to `.markdownlint.json`):

```ptree
@name_type:[
  ROOT: 'SCREAM_TYPE',
  DIR: 'High_Type',
  FILE: 'smol-type'
]

@seperation_delimiters: [
  '-',
  '_',
  '.'
]
```

These blocks are optional in the general format, but they are **required** by the canonical **spec** profile (`@ptree: spec`).

### 2.2 Directive line (optional)

Directive lines allow metadata without changing tree structure.

- A directive line **MUST** start with optional whitespace followed by `@`.
- A directive name **MUST** match: `[A-Za-z][A-Za-z0-9_-]*`
- A directive value **MAY** follow after `:` or `=`.

Examples:

```ptree
@ptree: 1.0
@root: my-project/
@generated: 2025-12-17
@style: unicode
```

Directives are optional. Tools that do not understand directives **MAY** ignore them.

### 2.3 Root line

The root line represents the conceptual root of the displayed tree.

A ptree document MAY use either of these conventions:

#### **Root path** (filesystem-like)

- The root line **SHOULD** appear once (commonly the first non-comment, non-directive line).
- The root line **SHOULD** end in `/`.

Example:

```ptree
my-project/
```

#### **Root label** (meta root marker)

- The root line **MAY** end in `//` to indicate it is a **label**, not a filesystem directory.
- When using a root label, tools SHOULD use the `@root:` directive (if present) to determine the real filesystem root path.

Example:

```ptree
@root: ./

MY_PROJECT-1.0.0//
```

The default `ptree` ruleset (see `docs/GRAMMAR.md`) prefers the **root label** form because it is visually distinct from real directories.

### 2.4 Node line

A node line represents a file or directory.

A node line has the general structure:

```ptree
<indent><connector><space><name><optional-symlink><optional-metadata>
```

Where:

- `<indent>` is zero or more **indent segments**
- `<connector>` is a branch token
- `<name>` is a single path segment (recommended to mark directories)

#### 2.4.1 Unicode style (recommended)

Unicode style uses box-drawing characters:

- Indent segments:
  - `"│   "` (vertical continuation)
  - `"    "` (empty)
- Connectors:
  - `"├──"` (non-last child)
  - `"└──"` (last child)

Example:

```ptree
my-project/
├── README.md
└── src/
    └── index.ts
```

#### 2.4.2 ASCII style (fallback)

ASCII style is allowed for environments where unicode is undesirable.

- Indent segments:
  - `"|   "` (vertical continuation)
  - `"    "` (empty)
- Connectors:
  - `"|--"` (non-last child)
  - ``"`--"`` (last child)

Example:

```ptree
my-project/
|-- README.md
`-- src/
    `-- index.ts
```

---

## 3. Depth and Hierarchy

### 3.1 Indent segment width

- One indent segment is **exactly 4 characters**.
- Depth is defined as the count of indent segments.

Examples:

- Depth 0 (top-level nodes): `├── name`
- Depth 1: `├── name`
- Depth 2: `│   ├── name`

### 3.2 Structural meaning

- A node **A** is a parent of node **B** if:
  - **B** appears after **A** in the document, and
  - **B** has depth exactly `depth(A) + 1`, and
  - there is no intervening node with depth `<= depth(A)` before **B**.

In practice: nodes belong to the most recent preceding node with smaller depth.

---

## 4. Names

### 4.1 Directory marker

To make directories unambiguous across tools, a directory name:

- **SHOULD** end with `/`.

Example:

```ptree
└── src/
    └── index.ts
```

Tools **MAY** infer directories structurally ("has children"), but that requires multi-line analysis.
The trailing `/` makes directory detection trivial and improves syntax highlighting.

### 4.2 Allowed characters

- Names **MAY** contain spaces and punctuation.
- Names **MUST NOT** contain newlines.

---

## 5. Symlinks (optional)

Symlinks are represented using an arrow:

```ptree
<name> -> <target>
```

The arrow token **MUST** be surrounded by single spaces.

Example:

```ptree
└── current -> releases/2025-12-17/
```

---

## 6. Inline Metadata (optional)

Inline metadata is allowed after the name.

### 6.1 Delimiter rule

To avoid ambiguity when names contain `#` or `[`, metadata **SHOULD** be separated from the name by **two or more spaces**.

### 6.2 Bracket attributes

Attributes are written as:

```ptree
  [key=value, key2=value2]
```

Example:

```ptree
├── package.json  [type=node]
└── src/  [lang=ts]
```

### 6.3 Inline comments

Comments are written as:

```ptree
  # comment
```

Example:

```ptree
└── README.md  # main docs entry
```

---

## 7. Summary Lines

Some generators (like `tree`) may append summary lines:

```ptree
12 directories, 48 files
```

Tools **MAY** treat these as metadata.

---

## 8. Canonicalization (recommended)

For a consistent ecosystem, generators **SHOULD**:

- use unicode style by default
- include a single root line ending in `/`
- suffix directories with `/`
- sort entries with **directories first**, then files, each group lexicographically

---

## 9. Compatibility Notes

- ptree is intentionally close to the common `tree` CLI output, but adds **standardization hooks** (directories ending in `/`, optional directives/attributes).
- The format is intentionally simple so it can be authored manually.

---

## 10. Reference Regex (non-normative)

A tolerant unicode/ascii node matcher:

```ptree
^((?:(?:│|\|) {3}| {4})*)(?:├──|└──|\|--|`--)(?:\s+)(.*)$
```

This is used in the accompanying VS Code extension.

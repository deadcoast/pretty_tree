# 09 — Examples and Patterns

This file provides generic PTREE examples. These are intentionally sanitized and broadly applicable.

> Note: examples are illustrative. Your project may include additional directories and files.

---

## Example 1 — Minimal project tree

```ptree
@ptree: default
@style: unicode
@root: ./

my-project/
├── readme.md
├── license
└── src/
    └── index.ts
```

---

## Example 2 — Spec profile artifact tree (canonical)

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
├── readme.md
├── changelog.md
├── ptree.config.json
├── Docs/
│   ├── specification.md
│   └── grammar.md
├── Src/
│   ├── index.ts
│   ├── tree-parser.ts
│   └── semantic-tokens.ts
└── Tests/
    ├── parser.test.ts
    └── Fixtures/
        └── sample-tree.ptree
```

---

## Example 3 — Monorepo layout (documentation-friendly)

```ptree
@ptree: default
@style: unicode
@root: ./

monorepo/
├── readme.md
├── packages/
│   ├── api/
│   │   ├── package.json
│   │   └── src/
│   └── web/
│       ├── package.json
│       └── src/
└── tools/
    └── scripts/
```

---

## Example 4 — Truncated subtree (good practice)

```ptree
@ptree: default
@style: unicode
@root: ./

app/
├── readme.md
├── src/
│   ├── index.ts
│   └── ... (subtree truncated)
└── tests/
    └── ...
```

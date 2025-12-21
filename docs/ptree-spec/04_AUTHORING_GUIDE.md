# 04 — Authoring Guide

This guide is for humans who write PTREE in READMEs, docs, tickets, and architecture notes.

## What makes a good PTREE document?

A good PTREE document is:

- **small enough to scan**, but complete enough to be meaningful
- **organized**, not exhaustive
- **truthful about intent** (is it illustrative, canonical, or exhaustive?)
- **stable** over time

### Prefer representative trees over exhaustive trees
A 2,000-line tree is rarely documentation.

PTREE is most useful when it shows:
- the structure that matters,
- the boundaries that matter,
- the naming conventions that matter.

If you need exhaustive inventories, generate them as build artifacts—but documentation trees should remain human-scalable.

---

## Recommended authoring patterns

### Pattern A — “Onboarding tree”
Use PTREE to show new contributors where to look:

- `Docs/` for guides
- `Src/` for implementation
- `Tests/` for verification
- `Tools/` for scripts

### Pattern B — “Artifact tree”
Use PTREE to document a release artifact, package, or output bundle.

This is where strict profiles shine: they make artifacts consistent and reviewable.

### Pattern C — “Interface tree”
Use PTREE to communicate boundaries:
- public API surface
- adapters
- contracts
- schemas

---

## Naming for clarity

PTREE values names that:
- are descriptive,
- are consistent,
- are predictable.

Avoid:
- “misc”, “stuff”, “tmp” in documentation trees
- “final-final-v2” naming
- spaces (unless your profile explicitly permits them)

---

## When to include metadata
Include metadata only when it changes the meaning.

Good metadata examples:
- flags like “generated”
- a short comment explaining purpose
- a tag indicating “entrypoint”

Bad metadata examples:
- long prose paragraphs embedded in the tree
- volatile sizes/timestamps that change constantly

---

## Practical editing tips

### Keep siblings grouped
Prefer grouping by function rather than by file extension.

### Keep depth reasonable
A tree deeper than ~6 levels is hard to read in docs.

### Keep it honest
If you omit subtrees intentionally, consider adding a short note outside the tree:
- “Subtree truncated for clarity.”

# 05 — Profiles

PTREE supports profiles because directory tree communication has two competing needs:

1) **Flexibility** for ad-hoc documentation and quick sharing  
2) **Strictness** for canonical artifacts, standards, and automation

A profile is how PTREE balances those needs without fragmenting.

---

## The default profile (“default”)

The default profile is intended for:
- READMEs and internal docs
- quick “here’s the structure” snippets
- work-in-progress trees
- diverse repos where naming varies

Characteristics:
- tolerant naming
- fewer required header directives
- broad compatibility

---

## The spec profile (“spec”)

The spec profile is intended for:
- published reference trees
- canonical artifacts (release bundles, templates)
- documentation that needs long-term consistency
- validation and automation workflows

Characteristics:
- required identity (root label)
- clear signals for directories vs files
- strict naming conventions
- consistent “house style”

---

## Choosing a profile

### Use “default” when:
- you’re documenting a real repository that has mixed naming conventions
- you need to paste a tree quickly without adjusting names
- strict enforcement would create noise or busywork

### Use “spec” when:
- you want a portable, canonical PTREE artifact
- you want reproducible validation across tools
- you want to standardize naming and structure

---

## Profile philosophy: strict documents are publishable documents
A strict tree is easier to:
- validate,
- lint,
- style consistently,
- reuse in other contexts,
- include in templates.

The spec profile exists to create trees that can be treated like “documents with guarantees.”

# PTREE Specification Suite

Version: 0.1 (documentation suite)
Date: 2025-12-21

This suite explains **what PTREE is**, what it is **for**, and the **goals** it aims to standardize.

It is intentionally **product- and implementation-agnostic**:
- It does **not** prescribe editor internals, regexes, token scopes, or parser code.
- It focuses on **meaning**, **intent**, **interoperability**, and **how people should use PTREE**.

If you are looking for implementation details (grammar files, folding providers, CLI flags, validators) SEE [ptree syntax docs](ptree-syntax/docs/)

---

## What is PTREE?

**PTREE** (“pretty tree”) is a **standardized, human-first, tool-friendly** way to represent a **directory tree** as text.

A PTREE document is:
- readable in plain text,
- stable for diffs and reviews,
- embeddable in Markdown and documentation,
- configurable (lint-style) so teams can enforce consistent naming and presentation,
- expressive enough for real-world documentation, without turning into a full filesystem database.

In short:

> PTREE is to directory trees what Markdown is to rich text:  
> a **common format** that works for both **humans** and **tools**.

---

## Why PTREE exists

Directory trees appear everywhere:
- READMEs and docs
- architecture diagrams
- onboarding guides
- bug reports and support tickets
- code review notes
- AI prompts and “context dumps”
- change logs and release notes

But the ecosystem lacks a **shared standard** for:
- how trees should look,
- how to mark directories vs files,
- how to embed trees in Markdown,
- how to enforce naming consistency,
- how to make trees pleasant to scan visually,
- how to keep trees stable across tooling and teams.

PTREE exists to fill that gap with a standard that is:
- **simple enough to adopt** immediately,
- **consistent enough to be reliable**,
- **structured enough to be enhanced** by editors and CLIs.

---

## The suite at a glance

1. [**01 — Vision and Goals**](01_VISION_AND_GOALS.md)
   What PTREE is trying to accomplish, and what it intentionally avoids.

2. [**02 — Design Principles**](02_DESIGN_PRINCIPLES.md)
   The philosophy behind the standard: readability, stability, interoperability.

3. [**03 — Concepts and Mental Model**](03_CONCEPTS.md)
   How to think about PTREE documents (tree, nodes, profiles, naming).

4. [**04 — Authoring Guide**](04_AUTHORING_GUIDE.md)
   How humans should write PTREE that is useful long-term.

5. [**05 — Profiles**](05_PROFILES.md)
   Why PTREE supports profiles (like “spec” vs “default”) and what each is for.

6. [**06 — Configuration and Rule Model**](06_CONFIGURATION_MODEL.md)
   The “markdownlint-style” configuration philosophy, without implementation detail.

7. [**07 — Use Cases**](07_USE_CASES.md)
   Where PTREE is most valuable in real workflows.

8. [**08 — Interoperability**](08_INTEROPERABILITY.md)
   How PTREE relates to Markdown, `tree` output, ASCII vs Unicode, and other systems.

9. [**09 — Examples and Patterns**](09_EXAMPLES.md)
   Canonical patterns and example trees (generic/sanitized).

10. [**10 — Governance and Versioning**](10_GOVERNANCE_VERSIONING.md)
   How PTREE evolves without breaking documents.

11. [**11 — Rationale**](11_RATIONALE.md)
   The reasons behind the “opinionated” choices.

12. [**12 — Glossary**](12_GLOSSARY.md)
   The terms used in the spec.

13. [**13 — FAQ**](13_FAQ.md)
   Frequently asked questions.

14.[**14 - Adoption Guide**](14_ADOPTION_GUIDE.md)
   How to adopt PTREE in your project or team.

15. [**15 — Positioning**](15_POSITIONING.md)
   How to position PTREE in your documentation.
---

## Quick definition

A PTREE document communicates:

- **Structure**: parent/child relationships among directories and files  
- **Identity**: “what is this tree describing?” (project, module, artifact)  
- **Style**: a consistent representation that can be rendered and validated  
- **Intent**: what the tree is for (example, reference, release artifact)

PTREE does not attempt to replace:
- filesystem metadata databases
- package manifests
- build systems
- full dependency graphs

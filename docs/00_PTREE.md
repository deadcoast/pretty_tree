# 00 PTREE

<!-- Below is a **single-page landing layout** in **product language (developer‑friendly)**. It’s written so you can paste it into a site generator (Docusaurus, Astro, Next.js MDX, GitHub Pages, etc.) or even a `README.md` as a “landing page”.
You can keep it as Markdown, or treat it as content blocks for a design system. -->

---

# PTREE — Pretty Tree

**Directory trees that read like documentation and behave like code.**

PTREE is a lightweight standard for representing project structure in plain text—so your directory trees are **consistent**, **scan‑friendly**, **Markdown‑native**, and **toolable** (folding, validation, and safe auto‑fixes).

**Use PTREE when you want structure to be:**

* easy to communicate
* easy to review in diffs
* easy to keep consistent over time

---

## Hero

### Make directory trees a first‑class part of your documentation

Most directory trees are copied once, then slowly drift into confusion.

PTREE turns “a tree in a README” into something you can treat like code:

* readable at a glance
* standardized across projects
* linted and validated
* safe to auto‑fix

**Primary CTA (button text):** Get the VS Code Extension
**Secondary CTA (button text):** Read the PTREE Spec
**Tertiary CTA (button text):** Install the CLI

*(Replace those with your actual destinations in your website.)*

---

## The problem

Directory trees show up everywhere:

* READMEs
* onboarding docs
* architecture docs
* PR descriptions
* tickets and incident notes

…but they’re usually:

* inconsistent (different symbols, spacing, naming conventions)
* visually noisy (hard to scan)
* ambiguous (folder vs file isn’t obvious)
* unvalidated (they drift silently over time)

**Result:** readers spend more time decoding the tree than understanding the structure.

---

## The solution

### PTREE is a standard tree format with intention

PTREE keeps the good parts of a classic `tree` output, but adds what documentation needs:

* **A standard header** (so tools know how to interpret the tree)
* **A canonical root label** (so the tree has a stable anchor)
* **Opinionated naming rules** (so trees stay readable and consistent)
* **Markdown friendliness** (so trees render well and stay portable)
* **Tool hooks** (so editors and CI can validate and help maintain them)

---

## What PTREE is designed to do

### 1) Read instantly

PTREE is designed so your eyes can parse structure quickly:

* scaffold characters fade into the background
* folders look like folders
* file extensions pop
* root and metadata are unmistakable

### 2) Stay consistent

PTREE standardizes “how we show trees” across:

* repos
* teams
* companies
* long-lived docs

### 3) Be toolable

PTREE isn’t just text. It’s a format tools can understand:

* fold/collapse sections in your editor
* validate naming conventions
* enforce canonical rules in CI
* apply safe auto-fixes

### 4) Work inside Markdown

PTREE is Markdown‑native by design:

````markdown
```ptree
PTREE-0.0.2//
└── Docs/
    └── overview.md
```
````

---

## Quick example

A PTREE document can declare its intent up front:

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
└── Docs/
    ├── overview.md
    └── authoring-guide.md
```

**What this gives you:**

* an unambiguous root anchor
* directories explicitly marked with `/`
* consistent naming conventions that can be validated
* a stable format that stays clean in diffs

---

## Features

### Standard format

PTREE defines a stable shape for tree documents:

* header directives
* scaffold and node structure
* canonical markers (like `/` and `//`)

### Profiles: flexible or strict

PTREE supports different levels of strictness:

* **default**: practical, compatible, and forgiving
* **spec**: canonical and opinionated for teams who want “one standard way”

### Configurable naming (lint-style)

PTREE uses a “lint configuration” model (think: the ergonomics of markdown linting):

* ships with a default rule set
* supports repo‑level customization
* central registry of name types (so rules, examples, and highlighting stay aligned)

### Editor experience (when supported by tooling)

* folding for large trees
* highlighting that distinguishes folders/files/extensions
* dynamic highlighting based on configured name types
* diagnostics that explain what violates the rules

### CI-friendly validation (when used with tooling)

* fail PRs when canonical trees drift
* keep docs accurate and consistent

---

## Why developers like it

### It’s portable

PTREE is plain text. No images. No custom rendering required.

### It’s diff-friendly

PTREE encourages stable formatting, which makes review easier.

### It scales

A small README tree is nice. A large docs structure is where PTREE shines—folding + consistency makes huge trees manageable.

### It reduces “doc entropy”

PTREE is built to prevent “structure documentation” from degrading over time.

---

## Who it’s for

PTREE is especially useful for:

* libraries and SDKs (clear module layout)
* monorepos (many packages, many folders)
* internal platforms (consistent standards across teams)
* documentation-heavy projects (architecture + onboarding docs)
* templates/scaffolds (show what gets generated)

---

## How it works

### Step 1 — Write a PTREE tree (or generate one)

Create a `.ptree` file or embed a PTREE code block in Markdown.

### Step 2 — Declare your intent

Use a header to define profile, style, and naming conventions.

### Step 3 — Let tools do the boring parts

When you enable PTREE tooling:

* validation catches naming drift
* auto-fixes handle safe formatting
* editor features improve readability

---

## Interoperability

PTREE is designed to play nicely with what developers already do:

* compatible with common tree visuals (`├──`, `└──`, `│`)
* supports Unicode and ASCII styles
* works inside Markdown fenced code blocks
* can be generated from real directories (tooling) or written by hand for illustrative docs

---

## Adoption guide (fast)

### Start small

* Use PTREE code blocks in docs
* Keep the structure readable and consistent

### Add rules when you’re ready

* Enable a default ruleset
* Introduce a repo config for consistent naming

### Go canonical for long-lived docs

* Turn on **spec** profile
* Validate in CI
* Use safe auto-fixes to stay consistent

---

## FAQ

### “Is PTREE just another `tree` output?”

It starts where `tree` ends: PTREE is a **documentation-first standard** with configuration, profiles, and tooling hooks.

### “Do I have to use strict naming?”

No. You can be flexible (default profile) or strict (spec profile). PTREE is designed to support both.

### “Will this break my docs if I don’t use the tooling?”

No. PTREE remains plain text. Tooling enhances it, but isn’t required for portability.

### “Is this meant to mirror the filesystem exactly?”

Sometimes yes (validation mode), sometimes no (illustrative docs). PTREE supports both use cases cleanly.

### “Can teams define their own naming conventions?”

Yes. PTREE supports configuration so teams aren’t boxed in—while still keeping the format standard.

---

## Roadmap (optional section for the landing page)

Common expansions teams adopt after first usage:

* richer auto-fixes (rename suggestions, normalization)
* formatting rules for stable ordering
* doc renderers that turn PTREE into interactive HTML in docs sites
* GitHub PR checks and annotations

---

## Footer CTA

### Make your directory trees readable, consistent, and toolable.

**CTA (button text):** Get Started with PTREE
**Secondary CTA (button text):** View Examples
**Tertiary CTA (button text):** Contribute / Propose a Rule

---

## Optional: “micro copy” blocks for a website hero

Use these if you want a more marketing-style hero:

**Headline options**

* “Stop pasting messy directory trees into your docs.”
* “Directory trees, standardized.”
* “Make structure documentation maintainable.”

**Subheadline options**

* “PTREE turns directory trees into a real format: readable, foldable, lintable, and Markdown-native.”
* “A small standard that makes repo structure easier to communicate—and easier to keep correct.”

**Tagline options**

* “Docs-friendly. Diff-friendly. Tool-friendly.”
* “Pretty trees with standards-grade consistency.”

---

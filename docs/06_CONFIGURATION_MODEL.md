# 06 — Configuration and Rule Model

PTREE uses a lint-style configuration model because naming and formatting conventions are inherently contextual.

Different organizations have:
- different naming styles,
- different repository shapes,
- different expectations for documentation artifacts.

A lint-style model makes PTREE:
- adoptable,
- enforceable,
- extensible.

---

## The default ruleset

PTREE ships with an opinionated default ruleset.
This ruleset aims to be:
- strict enough to be meaningful,
- flexible enough to avoid constant false positives.

The default rules exist so new users can adopt PTREE immediately without designing conventions from scratch.

---

## Central definitions: NAME_TYPES

Instead of scattering naming logic across tools, PTREE promotes a central registry of naming styles (“name types”).

This enables three things to agree:

1) **Examples** (what the docs show)
2) **Highlighting** (what editors emphasize)
3) **Validation** (what linters enforce)

This is the same “single source of truth” philosophy that makes lint tools effective.

---

## Rule IDs and severities

Rules are identified by stable IDs so they can be referenced across:
- documentation,
- editor diagnostics,
- CI logs.

Rules should support severities:
- info
- warning
- error

This enables gradual enforcement:
- start with warnings,
- transition to errors as the repo adopts conventions.

---

## Configuration scope

PTREE configuration is typically:
- repository-scoped (checked into the repo),
- optionally overridden in workspace settings.

This supports:
- consistent enforcement in CI,
- consistent editor behavior for contributors.

---

## Profiles and configuration

Profiles define baseline expectations.
Configuration allows:
- tightening or relaxing specific rules,
- defining custom name types,
- changing preferred conventions.

Profiles prevent a “blank slate” problem.
Configuration prevents “one-size-fits-all” rigidity.

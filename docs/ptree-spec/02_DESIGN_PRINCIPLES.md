# 02 — Design Principles

This document describes the design principles behind PTREE. These are the “rules behind the rules” and should guide future extensions, profiles, and tooling.

## P1 — Readability beats cleverness
PTREE favors conventions that are:
- easy to read at a glance,
- easy to teach,
- hard to misinterpret.

If a feature adds complexity without strong value, it belongs in tooling—not in the core format.

## P2 — Make the implicit explicit
PTREE prefers explicit markers where ambiguity harms tooling or comprehension.

Examples of “explicitness” (conceptually):
- directories are clearly distinguishable from files,
- roots are clearly distinguishable from regular directories.

## P3 — Stability is a feature
PTREE is commonly used inside documentation and code review.
A good PTREE representation should:
- avoid churn,
- avoid formatting that changes due to environment,
- remain stable across platforms.

## P4 — Interoperability > novelty
PTREE aligns with conventions developers already recognize (tree drawings, Markdown fences).
PTREE should integrate with existing tooling rather than requiring new ecosystems to be useful.

## P5 — Default rules should be opinionated and helpful
PTREE ships with a default ruleset because:
- teams need conventions to communicate efficiently,
- conventions reduce cognitive load,
- conventions make tooling reliable.

Opinionated defaults are not “lock-in” because PTREE also supports user configuration.

## P6 — Configuration should feel like lint configuration
The configuration model is intentionally similar to common lint tools:
- a default ruleset exists,
- users can override per repository,
- rule IDs exist for stable reference,
- failures can be warnings or errors.

This supports gradual adoption and incremental enforcement.

## P7 — Be strict where strictness adds meaning
PTREE should be strict where:
- ambiguity breaks parsing,
- ambiguity breaks folding/highlighting,
- ambiguity causes human misreads.

It should be flexible where:
- real repositories differ,
- ecosystems have legitimate naming variety.

The profile concept exists to support both needs.

## P8 — Extensibility without fragmentation
PTREE supports evolution by:
- versioned profiles,
- optional directives,
- safe extension points.

The goal is to avoid “dialects” that cannot be parsed by other tools.

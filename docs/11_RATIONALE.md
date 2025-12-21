# 11 — Rationale

This document explains *why* PTREE makes certain opinionated choices.

## Why standardize directory trees at all?
Because trees are shared constantly in developer communication, and inconsistency wastes time.

A standard enables:
- better readability,
- shared expectations,
- editor tooling,
- reliable parsing and validation.

## Why focus on “what it is” instead of “how it’s implemented”?
Because a standard is a **contract**.

Implementations can change.
The contract—what PTREE means, how it should be used, what goals it serves—must remain stable.

## Why profiles?
Because “one tree format” cannot satisfy both:
- permissive real-world repos, and
- strict publishable artifacts.

Profiles provide strictness without fragmentation.

## Why a lint-style model?
Naming and structure conventions are social and contextual.
Lint-style configuration is a proven way to:
- start with defaults,
- override locally,
- enforce in CI,
- evolve conventions gradually.

## Why prioritize diff stability?
Because most PTREE usage happens inside:
- Git
- PRs
- documentation histories

If PTREE churns, people stop trusting it.

## Why keep metadata minimal?
Because metadata can:
- become noisy,
- become unstable,
- reduce readability.

PTREE’s core value is structure and meaning, not exhaustive file facts.

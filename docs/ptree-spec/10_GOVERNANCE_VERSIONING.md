# 10 — Governance and Versioning

PTREE is intended to be a stable standard. Stability requires predictable evolution.

## Two kinds of versioning

### 1) Spec / profile versioning
Profiles can evolve:
- new recommended conventions,
- new optional directives,
- new lint rules.

A profile version communicates: “What guarantees does this document claim?”

### 2) Tooling versioning
Editors and CLIs evolve independently.
Tooling should remain compatible with documents even as tooling improves.

---

## Backward compatibility expectations

A PTREE document should remain readable forever, even if tooling changes.

As PTREE evolves:
- previously valid documents should not become invalid without a clear migration path,
- strict profiles should be versioned to preserve guarantees.

---

## Deprecation strategy

If a convention needs to change:
1. introduce the new behavior as optional,
2. provide warnings in tooling,
3. eventually promote the new behavior in a new profile version.

This avoids breaking existing documentation unexpectedly.

---

## Standardization philosophy

PTREE should remain:
- small,
- readable,
- stable.

Complexity belongs in:
- profiles,
- configuration,
- tooling (validators, formatters, generators).

The core goal is interoperability and shared understanding.

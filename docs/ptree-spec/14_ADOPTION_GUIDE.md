# Adoption Guide

This guide focuses on *how to adopt PTREE in real teams*.

## Where to start

### Start with documentation
Add a small PTREE block to your README:
- project structure
- where new contributors should look
- key directories

This yields immediate benefit with minimal overhead.

### Then add “rules”
Once a PTREE block exists, add a config file to enforce consistency gradually:
- start with warnings,
- move to errors over time.

## Recommended repository patterns

### Pattern: `docs/structure.ptree`
Keep a dedicated tree document for onboarding and architecture context.

### Pattern: “release artifact trees”
When you publish bundles (templates, SDKs, releases), publish a PTREE artifact alongside the release.

This makes artifacts reviewable and auditable.

## CI integration
Use a validator in CI to ensure canonical artifacts remain stable:
- fail PRs that break spec artifacts,
- warn for default-profile docs when conventions drift.

## Review culture tips
Treat PTREE like any other documentation artifact:
- keep it updated when structure changes,
- keep it concise,
- prefer stable ordering and naming.

## Common pitfalls
- letting trees become exhaustive inventories
- including volatile metadata that changes every build
- mixing naming styles without intent

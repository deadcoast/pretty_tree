# Plan

Using the plan skill to outline doc updates that align the 0.0.4 draft with the "turn key, simple, high-quality UX" vision while keeping the spec airtight for Markdown adoption.

## Requirements

- Lead with the primary purpose: syntax highlighting for directory trees and readable Markdown code blocks.
- Emphasize "simple to operate" defaults with optional advanced rules, without adding user burden.
- Keep claims strictly aligned to current 0.0.4 capabilities (extension + CLI).
- Standardize terminology across docs (profiles, directives, NAME_TYPES, spec vs default).
- Provide a short, clear "why/what/how" path for first-time users.

## Message map (draft)

- Purpose: syntax-first directory tree language with clear highlighting and stable structure.
- Non-goals: not a filesystem CLI replacement; not a general-purpose markup language; no required config.
- User value: readable trees in editors/docs, fast scanning, optional validation when desired.
- Positioning: Markdown is a common host, not the goal.

## Scope

- In: copy edits, structure changes, examples, and cross-references in the listed docs.
- Out: code changes, new features, or behavior changes to the spec/grammar.

## Files and entry points

- README.md
- 0.0.4/README.md
- 0.0.4/docs/SPEC.md
- 0.0.4/docs/GRAMMAR.md
- 0.0.4/docs/SEMANTIC_TOKENS.md
- 0.0.4/CHANGELOG.md

## Data model / API changes

- None.

## Action items

- [x] FOR EVERY TASK:['(1)DONT OVER-SIMPLIFY':'(1.1)COMPLETION DOES NOT MEAN REMOVAL OR SIMPLIFICATION']
  - [x] Draft a short message map (purpose, non-goals, user value) to reuse across all docs.
  - [x] Update README.md to foreground the "no syntax highlighting for trees" problem and the minimal ptree solution.
  - [x] Update 0.0.4/README.md to prioritize syntax highlighting, simplify feature text, and add a quick start.
  - [x] Tighten SPEC.md with a brief "Design Goals" section and clearer MUST/SHOULD wording.
  - [x] Develop GRAMMAR.md with a "Default vs spec profile" summary and current 0.0.4 examples.
  - [x] Shorten SEMANTIC_TOKENS.md to benefits + minimal customization guidance.
  - [x] Adjust 0.0.4/CHANGELOG.md wording if needed to match the "draft" positioning.

## Testing and validation

- Verify all examples match current spec/grammar rules and the 0.0.4 behavior.
- Check all cross-doc references and section titles for consistency.
- Scan for any promises that exceed the current implementation.

## Risks and edge cases

- Over-promising standardization or Markdown adoption; keep statements framed as goals.
- "Simple UX" messaging could conflict with detailed spec text; add a clear default path.

## Open questions

- Should "standard for Markdown" be framed as a vision section rather than current state?
- Do you want a dedicated "Vision / Roadmap" section in the READMEs?

---

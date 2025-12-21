# 08 — Interoperability

PTREE is designed to work with existing habits and tooling.

## Markdown
PTREE is intended to be embedded directly in Markdown fenced code blocks.

This makes it:
- copy/paste friendly,
- renderable in documentation platforms,
- compatible with static site generators.

## Unicode and ASCII
PTREE supports both Unicode and ASCII scaffold styles.

This ensures usability in:
- terminals and consoles,
- limited fonts,
- environments where Unicode rendering is inconsistent.

The meaning is identical regardless of scaffold style.

## Relationship to `tree` output
Many tools output directory trees. PTREE is not trying to replace those tools.

Instead, PTREE provides:
- a stable standard for documentation and interchange,
- a place where editor features can attach meaning.

Tools may generate PTREE; PTREE is not defined by any one tool.

## Line endings and portability
PTREE documents should be portable across:
- Windows
- macOS
- Linux

Tooling should treat line-ending differences as irrelevant to meaning.

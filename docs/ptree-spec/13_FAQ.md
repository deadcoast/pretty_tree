# FAQ

## Is PTREE just `tree` output?
No. `tree` is a tool output format; PTREE is a **standard language** for directory trees.

Tools can generate PTREE, but PTREE is not defined by any one tool.

## Why not just use Markdown lists?
Lists lose important structure cues at a glance and don’t match common developer expectations for trees.
PTREE preserves the familiar “tree drawing” while remaining parseable and lintable.

## Do I have to use the spec profile?
No. PTREE supports flexible usage. The spec profile exists for canonical artifacts and strict validation.

## Is PTREE only for codebases?
No. PTREE is for any hierarchical artifact:
- datasets
- docs sites
- release bundles
- build outputs
- templates
- configuration layouts

## Does PTREE require Unicode?
No. Unicode is preferred for clarity, but ASCII scaffolds are supported for compatibility.

## Can I include symlinks or generated files?
Yes. PTREE can include short annotations or tags to communicate that meaning. The core format stays structure-first.

## How should I handle huge trees?
Prefer a representative tree, truncate subtrees, and keep documentation trees human-scalable.

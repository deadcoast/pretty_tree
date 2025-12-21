# 03 — Concepts and Mental Model

This section explains how to think about PTREE. Understanding the model makes authoring and tooling predictable.

## PTREE Document
A PTREE document is a text artifact describing a directory hierarchy.

It typically contains:
- a **header** (directives describing what the document represents),
- a **root label** (human identity for the tree),
- a **tree body** (the structure).

## Node
A **node** is a line representing either:
- a directory, or
- a file, or
- a metadata marker (depending on profile conventions).

Every node has:
- a **depth** (its nesting level),
- a **name** (directory or filename),
- optional **annotations** (comments, tags).

## Scaffold
The scaffold is the visual “tree drawing” portion of each line.

Scaffold is not data; it is presentation.
But it is intentionally consistent so tools can:
- compute depth,
- infer parent/child relationships,
- enable folding.

## Root Identity vs Root Path
PTREE separates two ideas:

1) **Root identity**: a label that answers “what is this tree?”  
   Example: “PTREE-0.0.2//” (a spec artifact label)

2) **Root path**: a filesystem location that answers “where did this tree come from?”  
   Example: “@root: ./”

This separation makes PTREE usable both for:
- publishing structure in documentation, and
- referencing real filesystem roots in tooling.

## Profile
A **profile** is a named ruleset that defines opinionated expectations.

PTREE uses profiles so that:
- strict documents can be published reliably (“spec” profile),
- flexible documents can exist for ad-hoc usage (“default” profile),
- tools can behave predictably for each intent.

Profiles are not separate languages; they are “modes” within PTREE.

## Naming and Name Types
A “name type” is a naming style category, such as:
- screaming snake,
- title snake,
- kebab case,
- etc.

PTREE treats name types as a shared vocabulary so:
- humans can align conventions,
- tools can highlight meaning,
- validators can enforce consistency.

## Rule
A rule is a named convention that can be enabled/disabled and assigned severity.

Rules exist so teams can:
- adopt PTREE incrementally,
- enforce “house style”,
- keep trees consistent across teams.

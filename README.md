# ptree — Directory Tree Language

ptree is a plain-text, standardized directory tree format (`.ptree`) with a VS Code extension and optional CLI. Its first priority is syntax highlighting for directory trees across editors and docs; Markdown is a common host, not the goal. Spec 1.0.0 is the current draft, implemented by extension/CLI 0.0.5.

  [![Website](https://img.shields.io/badge/website-ptree-blue)](https://deadcoast.github.io/pretty_tree)

## Why ptree
- Directory trees are usually pasted as bland text with no structure or labels.
- ptree adds stable markers so editors can highlight folders, files, and extensions.
- Defaults stay simple; strict validation is opt-in.

## Vision (draft)
- Make directory trees a first-class syntax highlight target (goal).
- Keep the format simple for humans; complexity is opt-in.
- Provide a stable spec so tools and themes can treat trees consistently.

## Example

```ptree
@ptree: 1.0
@style: unicode
@root: ./

MY_PROJECT-0.0.0//
├── README.md
└── src/
    └── parser.ts
```

Minimal (no directives):

```ptree
my-project/
├── README.md
└── src/
    └── index.ts
```

## Specs & Grammar
- `ptree-syntax/docs/SPEC.md` — the ptree format specification.
- `ptree-syntax/docs/GRAMMAR.md` — naming grammar + lint rules.

## What's Here
- `ptree-syntax/` — VS Code extension + optional CLI (TypeScript).
- `ptree-syntax/src/` — extension entry, CLI, core parser/validator/fixer.
- `ptree-syntax/syntaxes/` — TextMate grammar for static highlighting.
- `ptree-syntax/config/` — default/spec profiles and JSON schema.
- `ptree-syntax/docs/` — format spec and grammar.

## Build & Run (Extension)
From `ptree-syntax/`:

```bash
npm install
npm run compile
```

Open `ptree-syntax/` in VS Code and press `F5` to launch the Extension Development Host.

## Configuration
The extension reads a workspace config (first match wins):

- `.ptreerc.json`
- `.ptree.json`
- `ptree.config.json`

## CLI (optional)

### Node.js CLI
From `ptree-syntax/` after compiling:

```bash
node bin/ptree.js gen . --style unicode --max-depth 3
node bin/ptree.js validate samples/example.ptree
node bin/ptree.js validate samples/example.ptree --fix --write
```

### Python Wrapper
A thin Python wrapper is available for convenience:

```bash
pip install -e .
ptree gen . --style unicode --max-depth 3
ptree validate ptree-syntax/samples/example.ptree
```

The wrapper requires Node.js and the compiled TypeScript (`npm run compile` in `ptree-syntax/`).

## License
MIT — see `LICENSE`.

# ptree — Directory Tree Language

ptree is a plain-text, standardized directory tree format (`.ptree`) with a VS Code extension and optional CLI. Its first priority is syntax highlighting for directory trees across editors and docs; Markdown is a common host, not the goal. Spec 1.0.0 is the current draft, implemented by extension/CLI 0.0.4.

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
- `0.0.4/docs/SPEC.md` — the ptree format specification.
- `0.0.4/docs/GRAMMAR.md` — naming grammar + lint rules.

## What's Here
- `0.0.4/` — VS Code extension + optional CLI (TypeScript).
- `0.0.4/src/` — extension entry, CLI, core parser/validator/fixer.
- `0.0.4/syntaxes/` — TextMate grammar for static highlighting.
- `0.0.4/config/` — default/spec profiles and JSON schema.
- `0.0.4/docs/` — format spec and grammar.

## Build & Run (Extension)
From `0.0.4/`:

```bash
npm install
npm run compile
```

Open `0.0.4/` in VS Code and press `F5` to launch the Extension Development Host.

## Configuration
The extension reads a workspace config (first match wins):

- `.ptreerc.json`
- `.ptree.json`
- `ptree.config.json`

## CLI (optional)

### Node.js CLI
From `0.0.4/` after compiling:

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
ptree validate 0.0.4/samples/example.ptree
```

The wrapper requires Node.js and the compiled TypeScript (`npm run compile` in `0.0.4/`).

## License
MIT — see `LICENSE`.

# Repository Guidelines

## Project Structure & Module Organization
- `0.0.4/` houses the VS Code extension and CLI (TypeScript).
- `0.0.4/src/` contains the extension entry (`extension.ts`), CLI (`cli.ts`), and core logic in `src/core/` (parser, validator, fixer, config).
- Tests live in `0.0.4/src/test/`; unit specs are in `0.0.4/src/test/suite/*.test.ts`.
- Supporting assets include `0.0.4/config/` (profiles + schema), `0.0.4/syntaxes/`, `0.0.4/language-configuration.json`, and `0.0.4/docs/`.
- Repository root includes a minimal Python package (`pyproject.toml`, `main.py`) plus `install.sh`.
- Generated artifacts: `0.0.4/out/`, `0.0.4/node_modules/`, and `ptree.egg-info/` (avoid editing by hand).

## Build, Test, and Development Commands
Run from `0.0.4/`:
- `npm install` installs dependencies.
- `npm run compile` builds to `0.0.4/out/`.
- `npm run watch` watches TypeScript compilation.
- `npm run lint` runs ESLint.
- `npm run test` runs the VS Code extension test harness.
- `npm run test:unit` runs Mocha unit tests.
- `npm run ptree -- gen . --style unicode --max-depth 3` runs the CLI after compiling.
To debug the extension, open `0.0.4/` in VS Code and press `F5`.

## Coding Style & Naming Conventions
- Indentation is 2 spaces; TypeScript uses semicolons.
- ESLint config is `0.0.4/.eslintrc.json`; fix warnings before pushing.
- Naming: camelCase for variables/functions, PascalCase for types/classes; imports should be camelCase or PascalCase.
- File names follow existing camelCase patterns (for example, `codeActions.ts`).

## Testing Guidelines
- Frameworks: Mocha for unit tests, `@vscode/test-electron` for extension tests.
- Test files are named `*.test.ts` under `0.0.4/src/test/suite/`.
- No explicit coverage threshold; add tests when touching parser/validator/semantic tokens or CLI behavior.

## Commit & Pull Request Guidelines
- Commit messages in history are sentence-style summaries (for example, “Add …”); keep them concise and descriptive.
- PRs should include a clear description, rationale, and testing notes (`npm run test`/`npm run test:unit`); include screenshots or GIFs for editor UI changes.

## Configuration & Specs
- Profiles and schemas live in `0.0.4/config/`; format docs are in `0.0.4/docs/`.
- User config files (`.ptreerc.json`, `.ptree.json`, `ptree.config.json`) are supported by the extension.

#!/usr/bin/env node

// Small wrapper so the compiled CLI can be executed as `ptree`.
// In this repository, run:
//   npm run compile
//   node bin/ptree.js gen .
//
// If you publish the CLI to npm, you can point package.json "bin" to this file.

require('../out/cli.js');

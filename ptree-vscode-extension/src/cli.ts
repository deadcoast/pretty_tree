/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';

import { loadEffectiveConfig, type ConfigProfile } from './core/config';
import { parsePtreeDocument } from './core/parser';
import { validatePtreeDocument } from './core/validator';
import { applyCanonicalFixes } from './core/fixer';

type Style = 'unicode' | 'ascii';

type Profile = ConfigProfile;

function asProfile(v: unknown): Profile {
  return String(v ?? '').trim() === 'spec' ? 'spec' : 'default';
}

function detectProfileFromDirectives(directives: Record<string, string>): Profile {
  return (directives['ptree'] ?? '').trim() === 'spec' ? 'spec' : 'default';
}


function usage(exitCode = 0): never {
  const msg = `
ptree CLI

Usage:
  ptree gen [path] [--profile default|spec] [--style unicode|ascii] [--max-depth N] [--version X]
  ptree validate <file.ptree> [--profile default|spec] [--workspace-root DIR] [--fix] [--write]

Notes:
  - If --profile is omitted, validate auto-detects from @ptree: <value>.
  - Config lookup (markdownlint-style) from workspace-root:
      .ptreerc.json | .ptree.json | ptree.config.json
  - In "spec" profile, the CLI emits/validates the canonical header directives.

Examples:
  ptree gen . --profile spec --version 0.0.2
  ptree validate samples/example.ptree
  ptree validate samples/example.ptree --fix --write
`;
  console.error(msg.trimEnd());
  process.exit(exitCode);
}

function parseArgs(argv: string[]): { cmd?: string; positionals: string[]; flags: Record<string, string | boolean> } {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let cmd: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!cmd && !a.startsWith('-')) {
      cmd = a;
      continue;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else {
      positionals.push(a);
    }
  }

  return { cmd, positionals, flags };
}

function toScreamType(s: string): string {
  return s
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || 'PROJECT';
}

function makeTree(
  rootPath: string,
  style: Style,
  maxDepth: number
): string[] {
  const unicode = {
    tee: '├──',
    last: '└──',
    vert: '│   ',
    space: '    '
  };
  const ascii = {
    tee: '|--',
    last: '`--',
    vert: '|   ',
    space: '    '
  };
  const glyph = style === 'ascii' ? ascii : unicode;

  const ignore = new Set<string>(['.git', 'node_modules', '.DS_Store']);

  const lines: string[] = [];

  const walk = (dir: string, prefix: string, depth: number) => {
    if (depth > maxDepth) return;

    let entries = fs.readdirSync(dir, { withFileTypes: true });
    entries = entries.filter(e => !ignore.has(e.name));

    // Sort: dirs first, then files; each alpha.
    entries.sort((a, b) => {
      const ad = a.isDirectory() ? 0 : 1;
      const bd = b.isDirectory() ? 0 : 1;
      if (ad !== bd) return ad - bd;
      return a.name.localeCompare(b.name);
    });

    entries.forEach((e, idx) => {
      const isLast = idx === entries.length - 1;
      const conn = isLast ? glyph.last : glyph.tee;

      const full = path.join(dir, e.name);
      const displayName = e.isDirectory() ? `${e.name}/` : e.name;
      lines.push(`${prefix}${conn} ${displayName}`);

      if (e.isDirectory()) {
        const nextPrefix = prefix + (isLast ? glyph.space : glyph.vert);
        walk(full, nextPrefix, depth + 1);
      }
    });
  };

  walk(rootPath, '', 1);
  return lines;
}

function cmdGen(positionals: string[], flags: Record<string, string | boolean>) {
  const p = positionals[0] ? path.resolve(positionals[0]) : process.cwd();
  const profile = asProfile(flags.profile);
  const style = (profile === 'spec' ? 'unicode' : (String(flags.style ?? 'unicode') as Style));
  const maxDepth = Math.max(1, parseInt(String(flags['max-depth'] ?? '25'), 10) || 25);

  const version = String(flags.version ?? (profile === 'spec' ? '0.0.2' : '0.0.0')).trim();

  const out: string[] = [];

  if (profile === 'spec') {
    out.push('@ptree: spec');
    out.push('@style: unicode');
    out.push(`@version: ${version}`);
    out.push('@name_type:[');
    out.push("    ROOT: 'SCREAM_TYPE',");
    out.push("    DIR: 'High_Type',");
    out.push("    FILE: 'smol-type'");
    out.push(']');
    out.push('@seperation_delimiters: [');
    out.push("    '-',");
    out.push("    '_',");
    out.push("    '.'");
    out.push(']');
    out.push('');
    out.push(`PTREE-${version}//`);
  } else {
    const folderName = path.basename(p);
    const rootLabel = `${toScreamType(folderName)}-0.0.0//`;

    out.push('@ptree: 1.0');
    out.push(`@style: ${style}`);
    out.push(`@root: ${p.replace(/\\/g, '/')}/`);
    out.push('');
    out.push(rootLabel);
  }

  out.push(...makeTree(p, style, maxDepth));

  process.stdout.write(out.join('\n') + '\n');
}

function cmdValidate(positionals: string[], flags: Record<string, string | boolean>) {
  const file = positionals[0];
  if (!file) usage(2);

  const absFile = path.resolve(file);
  const workspaceRoot = flags['workspace-root'] ? path.resolve(String(flags['workspace-root'])) : process.cwd();
  const projectRoot = path.resolve(__dirname, '..');

  const text = fs.readFileSync(absFile, 'utf-8');
  const doc = parsePtreeDocument(text);

  const profile = flags.profile ? asProfile(flags.profile) : detectProfileFromDirectives(doc.directives);
  const { config } = loadEffectiveConfig(projectRoot, workspaceRoot, profile);

  const doFix = Boolean(flags.fix);
  const doWrite = Boolean(flags.write);

  if (doFix) {
    const res = applyCanonicalFixes(text, doc, config);
    const fixed = res.fixedText;

    if (doWrite) {
      fs.writeFileSync(absFile, fixed, 'utf-8');
      console.error(`WROTE  ${file}`);
    } else {
      process.stdout.write(fixed + (fixed.endsWith('\n') ? '' : '\n'));
    }

    if (res.applied.length > 0) {
      console.error(`FIXED  ${res.applied.length} change(s)`);
    }

    const doc2 = parsePtreeDocument(fixed);
    const msgs2 = validatePtreeDocument(doc2, config);
    if (msgs2.length === 0) {
      process.exit(0);
    }
    for (const m of msgs2) {
      const loc = `${file}:${m.line + 1}:${m.startCol + 1}`;
      console.error(`${loc}  ${m.severity.toUpperCase()}  ${m.code}  ${m.message}`);
    }
    process.exit(1);
  }

  const msgs = validatePtreeDocument(doc, config);

  if (msgs.length === 0) {
    console.log(`OK  ${file}`);
    process.exit(0);
  }

  for (const m of msgs) {
    const loc = `${file}:${m.line + 1}:${m.startCol + 1}`;
    console.log(`${loc}  ${m.severity.toUpperCase()}  ${m.code}  ${m.message}`);
  }

  process.exit(1);
}

const { cmd, positionals, flags } = parseArgs(process.argv);

if (!cmd || cmd === 'help' || cmd === '--help' || flags.help) {
  usage(0);
}

switch (cmd) {
  case 'gen':
    cmdGen(positionals, flags);
    break;
  case 'validate':
    cmdValidate(positionals, flags);
    break;
  default:
    usage(2);
}
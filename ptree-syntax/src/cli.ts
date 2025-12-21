/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';

import { loadEffectiveConfig, type ConfigProfile } from './core/config';
import { parsePtreeDocument } from './core/parser';
import { validatePtreeDocument } from './core/validator';
import { applyCanonicalFixes } from './core/fixer';

type Style = 'unicode' | 'ascii';

type Profile = ConfigProfile;

type OutputFormat = 'text' | 'json';

type JsonLintMessage = {
  file: string;
  line: number;
  column: number;
  code: string;
  severity: string;
  message: string;
};

function formatMessagesAsJson(file: string, msgs: { code: string; severity: string; message: string; line: number; startCol: number }[]): string {
  const jsonMsgs: JsonLintMessage[] = msgs.map(m => ({
    file,
    line: m.line + 1,
    column: m.startCol + 1,
    code: m.code,
    severity: m.severity.toUpperCase(),
    message: m.message
  }));
  return JSON.stringify(jsonMsgs, null, 2);
}

function createUnifiedDiff(originalText: string, fixedText: string, fileName: string): string {
  const originalLines = originalText.split('\n');
  const fixedLines = fixedText.split('\n');
  
  const diff: string[] = [];
  diff.push(`--- a/${fileName}`);
  diff.push(`+++ b/${fileName}`);
  
  // Find changed regions and create hunks
  const hunks: { origStart: number; origCount: number; fixedStart: number; fixedCount: number; lines: string[] }[] = [];
  
  let i = 0;
  let j = 0;
  
  while (i < originalLines.length || j < fixedLines.length) {
    // Skip matching lines
    if (i < originalLines.length && j < fixedLines.length && originalLines[i] === fixedLines[j]) {
      i++;
      j++;
      continue;
    }
    
    // Found a difference - create a hunk
    const hunkOrigStart = Math.max(0, i - 3);
    const hunkFixedStart = Math.max(0, j - 3);
    const hunkLines: string[] = [];
    let origCount = 0;
    let fixedCount = 0;
    
    // Add context before
    for (let k = hunkOrigStart; k < i; k++) {
      hunkLines.push(` ${originalLines[k]}`);
      origCount++;
      fixedCount++;
    }
    
    // Find the extent of the change
    let origEnd = i;
    let fixedEnd = j;
    
    // Look for the next matching sequence
    let foundMatch = false;
    for (let oi = i; oi < Math.min(originalLines.length, i + 50) && !foundMatch; oi++) {
      for (let fi = j; fi < Math.min(fixedLines.length, j + 50) && !foundMatch; fi++) {
        // Check if we have 3 consecutive matching lines
        let matchLen = 0;
        while (oi + matchLen < originalLines.length && 
               fi + matchLen < fixedLines.length && 
               originalLines[oi + matchLen] === fixedLines[fi + matchLen]) {
          matchLen++;
          if (matchLen >= 3) {
            origEnd = oi;
            fixedEnd = fi;
            foundMatch = true;
            break;
          }
        }
      }
    }
    
    if (!foundMatch) {
      origEnd = originalLines.length;
      fixedEnd = fixedLines.length;
    }
    
    // Add removed lines
    for (let k = i; k < origEnd; k++) {
      hunkLines.push(`-${originalLines[k]}`);
      origCount++;
    }
    
    // Add added lines
    for (let k = j; k < fixedEnd; k++) {
      hunkLines.push(`+${fixedLines[k]}`);
      fixedCount++;
    }
    
    // Add context after
    const contextAfter = Math.min(3, originalLines.length - origEnd, fixedLines.length - fixedEnd);
    for (let k = 0; k < contextAfter; k++) {
      if (origEnd + k < originalLines.length && fixedEnd + k < fixedLines.length &&
          originalLines[origEnd + k] === fixedLines[fixedEnd + k]) {
        hunkLines.push(` ${originalLines[origEnd + k]}`);
        origCount++;
        fixedCount++;
      }
    }
    
    hunks.push({
      origStart: hunkOrigStart,
      origCount,
      fixedStart: hunkFixedStart,
      fixedCount,
      lines: hunkLines
    });
    
    i = origEnd + contextAfter;
    j = fixedEnd + contextAfter;
  }
  
  // Output hunks
  for (const hunk of hunks) {
    diff.push(`@@ -${hunk.origStart + 1},${hunk.origCount} +${hunk.fixedStart + 1},${hunk.fixedCount} @@`);
    diff.push(...hunk.lines);
  }
  
  return diff.join('\n');
}

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
  ptree gen [path] [--profile default|spec] [--style unicode|ascii] [--max-depth N] [--version X] [--name-type DIR:TYPE,FILE:TYPE]
  ptree validate <file.ptree> [--profile default|spec] [--workspace-root DIR] [--fix] [--write] [--format text|json] [--diff]

Notes:
  - If --profile is omitted, validate auto-detects from @ptree: <value>.
  - Config lookup (markdownlint-style) from workspace-root:
      .ptreerc.json | .ptree.json | ptree.config.json
  - In "spec" profile, the CLI emits/validates the canonical header directives.
  - Use --format json for machine-readable output (CI/CD integration).
  - Use --diff to preview fixes as a unified diff without applying them.
  - Use --name-type to specify naming conventions (e.g., --name-type DIR:High_Type,FILE:smol-type).
    Available NAME_TYPEs: SCREAM_TYPE, High_Type, Cap-Type, CamelType, smol-type, snake_type

Examples:
  ptree gen . --profile spec --version 1.0.0
  ptree gen . --name-type DIR:High_Type,FILE:smol-type
  ptree validate samples/example.ptree
  ptree validate samples/example.ptree --fix --write
  ptree validate samples/example.ptree --format json
  ptree validate samples/example.ptree --diff
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

/**
 * Parse a name-type specification string like "DIR:High_Type,FILE:smol-type"
 */
function parseNameTypeSpec(spec: string): { DIR?: string; FILE?: string } {
  const result: { DIR?: string; FILE?: string } = {};
  const parts = spec.split(',');
  for (const part of parts) {
    const [entity, nameType] = part.split(':').map(s => s.trim());
    if (entity === 'DIR' || entity === 'FILE') {
      result[entity] = nameType;
    }
  }
  return result;
}

/**
 * Split a name into words based on common delimiters and case boundaries.
 */
function splitIntoWords(name: string): string[] {
  // Remove extension for files
  const dotIndex = name.lastIndexOf('.');
  const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  
  // Split on common delimiters and case boundaries
  return baseName
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase -> camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // XMLParser -> XML Parser
    .replace(/[-_.\s]+/g, ' ')  // Replace delimiters with space
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/**
 * Convert a name to the specified NAME_TYPE format.
 */
function convertToNameType(name: string, nameType: string): string {
  // Handle dotfiles/dotdirs - preserve as-is
  if (name.startsWith('.')) {
    return name;
  }
  
  // Extract extension for files
  const dotIndex = name.lastIndexOf('.');
  const hasExtension = dotIndex > 0;
  const extension = hasExtension ? name.slice(dotIndex) : '';
  
  const words = splitIntoWords(name);
  if (words.length === 0) {
    return name;
  }
  
  let converted: string;
  
  switch (nameType) {
    case 'SCREAM_TYPE':
      converted = words.map(w => w.toUpperCase()).join('_');
      break;
    case 'High_Type':
      converted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('_');
      break;
    case 'Cap-Type':
      converted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
      break;
    case 'CamelType':
      converted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      break;
    case 'smol-type':
      converted = words.map(w => w.toLowerCase()).join('-');
      break;
    case 'snake_type':
      converted = words.map(w => w.toLowerCase()).join('_');
      break;
    default:
      // Unknown type, return original
      return name;
  }
  
  return converted + extension.toLowerCase();
}

function makeTree(
  rootPath: string,
  style: Style,
  maxDepth: number,
  nameTypes?: { DIR?: string; FILE?: string }
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
      
      // Apply name type conversion if specified
      let displayName = e.name;
      if (e.isDirectory()) {
        if (nameTypes?.DIR) {
          displayName = convertToNameType(e.name, nameTypes.DIR);
        }
        displayName = `${displayName}/`;
      } else {
        if (nameTypes?.FILE) {
          displayName = convertToNameType(e.name, nameTypes.FILE);
        }
      }
      
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

  const version = String(flags.version ?? (profile === 'spec' ? '1.0.0' : '0.0.0')).trim();

  // Parse name-type specification
  const nameTypeSpec = flags['name-type'] ? parseNameTypeSpec(String(flags['name-type'])) : undefined;
  
  // For spec profile, default to High_Type for DIR and smol-type for FILE
  const nameTypes = profile === 'spec' 
    ? { DIR: nameTypeSpec?.DIR ?? 'High_Type', FILE: nameTypeSpec?.FILE ?? 'smol-type' }
    : nameTypeSpec;

  const out: string[] = [];

  if (profile === 'spec') {
    out.push('@ptree: spec');
    out.push('@style: unicode');
    out.push(`@version: ${version}`);
    out.push('@name_type:[');
    out.push("    ROOT: 'SCREAM_TYPE',");
    out.push(`    DIR: '${nameTypes?.DIR ?? 'High_Type'}',`);
    out.push(`    FILE: '${nameTypes?.FILE ?? 'smol-type'}'`);
    out.push(']');
    out.push('@separation_delimiters: [');
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
    
    // Add @name_type directive if custom name types are specified
    if (nameTypes) {
      out.push('@name_type:[');
      out.push("    ROOT: 'SCREAM_TYPE',");
      if (nameTypes.DIR) {
        out.push(`    DIR: '${nameTypes.DIR}',`);
      }
      if (nameTypes.FILE) {
        out.push(`    FILE: '${nameTypes.FILE}'`);
      }
      out.push(']');
    }
    
    out.push('');
    out.push(rootLabel);
  }

  out.push(...makeTree(p, style, maxDepth, nameTypes));

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
  const doDiff = Boolean(flags.diff);
  const outputFormat: OutputFormat = String(flags.format ?? 'text') === 'json' ? 'json' : 'text';

  // --diff mode: show unified diff of proposed fixes without applying
  if (doDiff) {
    const res = applyCanonicalFixes(text, doc, config);
    const fixed = res.fixedText;
    
    if (text === fixed) {
      if (outputFormat === 'json') {
        console.log(JSON.stringify({ file, changes: 0, diff: null }));
      } else {
        console.log(`No changes needed for ${file}`);
      }
      process.exit(0);
    }
    
    const diffOutput = createUnifiedDiff(text, fixed, file);
    
    if (outputFormat === 'json') {
      console.log(JSON.stringify({ 
        file, 
        changes: res.applied.length, 
        applied: res.applied,
        diff: diffOutput 
      }, null, 2));
    } else {
      console.log(diffOutput);
      console.error(`\n${res.applied.length} change(s) would be applied`);
    }
    process.exit(0);
  }

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
    
    if (outputFormat === 'json') {
      console.log(formatMessagesAsJson(file, msgs2));
    } else {
      for (const m of msgs2) {
        const loc = `${file}:${m.line + 1}:${m.startCol + 1}`;
        console.error(`${loc}  ${m.severity.toUpperCase()}  ${m.code}  ${m.message}`);
      }
    }
    process.exit(1);
  }

  const msgs = validatePtreeDocument(doc, config);

  if (msgs.length === 0) {
    if (outputFormat === 'json') {
      console.log(formatMessagesAsJson(file, []));
    } else {
      console.log(`OK  ${file}`);
    }
    process.exit(0);
  }

  if (outputFormat === 'json') {
    console.log(formatMessagesAsJson(file, msgs));
  } else {
    for (const m of msgs) {
      const loc = `${file}:${m.line + 1}:${m.startCol + 1}`;
      console.log(`${loc}  ${m.severity.toUpperCase()}  ${m.code}  ${m.message}`);
    }
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

import { PtreeDocument, PtreeNode, parseIndexFile } from './parser';
import { NameTypeDef, PtreeConfig, RuleSetting, Severity } from './config';

export type LintMessage = {
  code: string;
  severity: Severity;
  message: string;
  line: number;
  startCol: number;
  endCol: number;
};

const SEMVER_RE = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/;
const SPLIT_VERSION_RE = new RegExp(`^(.*?)([-_])(${SEMVER_RE.source})$`);

function getRuleSetting(config: PtreeConfig, code: string): { enabled: boolean; severity: Severity; raw: RuleSetting | undefined } {
  const rules = config.RULES ?? {};
  const defaultEnabled = typeof rules.default === 'boolean' ? rules.default : true;
  const raw = rules[code];

  if (raw === undefined) {
    return { enabled: defaultEnabled, severity: 'warning', raw: undefined };
  }

  if (typeof raw === 'boolean') {
    return { enabled: raw, severity: 'warning', raw };
  }

  const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : defaultEnabled;
  const severity = (raw.severity as Severity) ?? 'warning';
  return { enabled, severity, raw };
}

function compileNameType(def: NameTypeDef): RegExp {
  return new RegExp(def.pattern);
}

function classifyNode(name: string): 'META' | 'DIR' | 'FILE' {
  if (name.endsWith('//')) return 'META';
  if (name.endsWith('/')) return 'DIR';
  return 'FILE';
}

function stripTrailingMarkers(name: string): string {
  if (name.endsWith('//')) return name.slice(0, -2);
  if (name.endsWith('/')) return name.slice(0, -1);
  return name;
}

type FileSplitStrategy = 'lastDot' | 'firstDot';

function splitFileParts(fileName: string, strategy: FileSplitStrategy): { stem: string; ext: string | null } {
  // Treat dotfiles like `.gitignore` as extensionless if they contain only the leading dot.
  if (fileName.startsWith('.') && fileName.indexOf('.', 1) === -1) {
    return { stem: fileName, ext: null };
  }

  const dot = strategy === 'firstDot' ? fileName.indexOf('.') : fileName.lastIndexOf('.');
  if (dot <= 0) return { stem: fileName, ext: null };

  return {
    stem: fileName.slice(0, dot),
    ext: fileName.slice(dot + 1)
  };
}

function splitVersion(name: string): { base: string; versionDelimiter: string | null; version: string | null } {
  const m = name.match(SPLIT_VERSION_RE);
  if (!m) return { base: name, versionDelimiter: null, version: null };
  return { base: m[1], versionDelimiter: m[2], version: m[3] };
}


const SEMVER_STRICT_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

function isSemver(v: string): boolean {
  return SEMVER_STRICT_RE.test(v.trim());
}

function parseNameTypeDirective(raw: string): Record<string, string> | null {
  // Accept a small, YAML-ish subset:
  // @name_type:[
  //   ROOT: 'SCREAM_TYPE',
  //   DIR: 'High_Type',
  //   FILE: 'smol-type'
  // ]
  const out: Record<string, string> = {};
  const re = /\b(ROOT|DIR|FILE|EXT|META)\b\s*:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out[m[1]] = m[2];
  }
  return Object.keys(out).length > 0 ? out : null;
}

function parseDelimiterListDirective(raw: string): string[] | null {
  // Accept:
  // @separation_delimiters: ['-','_','.']
  // @separation_delimiters: [
  //   '-',
  //   '_',
  //   '.'
  // ]
  const out: string[] = [];
  const re = /['"]([\-_.])['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out.push(m[1]);
  }
  return out.length > 0 ? out : null;
}
function findMatchingNameTypeId(bareName: string, allowed: string[] | undefined, nameTypes: Record<string, NameTypeDef>): string | null {
  if (!allowed || allowed.length === 0) return null;

  for (const id of allowed) {
    const def = nameTypes[id];
    if (!def) continue;
    const re = compileNameType(def);
    if (re.test(bareName)) return id;
  }

  return null;
}

function mkMsg(code: string, severity: Severity, message: string, line: number, startCol: number, endCol: number): LintMessage {
  return { code, severity, message, line, startCol, endCol };
}

function nodeSpan(node: PtreeNode): { line: number; startCol: number; endCol: number } {
  return { line: node.line, startCol: node.startCol, endCol: Math.max(node.startCol + 1, node.endCol) };
}

export function validatePtreeDocument(doc: PtreeDocument, config: PtreeConfig): LintMessage[] {
  const msgs: LintMessage[] = [];

  const fileSplit: FileSplitStrategy = (config.FILE_EXTENSION_SPLIT === 'firstDot' ? 'firstDot' : 'lastDot');

  const rules = {
    PT001: getRuleSetting(config, 'PT001'),
    PT002: getRuleSetting(config, 'PT002'),
    PT003: getRuleSetting(config, 'PT003'),
    PT004: getRuleSetting(config, 'PT004'),
    PT005: getRuleSetting(config, 'PT005'),
    PT006: getRuleSetting(config, 'PT006'),
    PT007: getRuleSetting(config, 'PT007'),
    PT008: getRuleSetting(config, 'PT008'),
    PT009: getRuleSetting(config, 'PT009'),
    PT010: getRuleSetting(config, 'PT010'),
    PT011: getRuleSetting(config, 'PT011'),
    PT012: getRuleSetting(config, 'PT012'),
    PT013: getRuleSetting(config, 'PT013'),
    PT014: getRuleSetting(config, 'PT014'),
    PT015: getRuleSetting(config, 'PT015')
  };

  // Surface parser errors as PT000.
  for (const e of doc.errors) {
    const start = e.startCol ?? 0;
    const end = e.endCol ?? start + 1;
    msgs.push(mkMsg('PT000', 'warning', e.message, e.line, start, end));
  }

  // PT003: require @ptree
  if (rules.PT003.enabled) {
    if (!('ptree' in doc.directives)) {
      // Put it on first line if possible.
      msgs.push(mkMsg('PT003', rules.PT003.severity, 'Missing required directive: @ptree: <version>', 0, 0, 1));
    }
  }

  
  const isSpec = (config.profile === 'spec') || (config.ptree === 'spec') || ((doc.directives['ptree'] ?? '').trim() === 'spec');

  // Spec header rules (canonical mode)
  if (isSpec) {
    // PT010: @ptree must equal "spec"
    if (rules.PT010.enabled) {
      const expected = (rules.PT010.raw && typeof rules.PT010.raw === 'object' && 'expected' in rules.PT010.raw)
        ? String((rules.PT010.raw as any).expected)
        : 'spec';
      const actual = (doc.directives['ptree'] ?? '').trim();
      if (!actual) {
        msgs.push(mkMsg('PT010', rules.PT010.severity, 'Missing required directive: @ptree: spec', 0, 0, 1));
      } else if (actual !== expected) {
        msgs.push(mkMsg('PT010', rules.PT010.severity, `@ptree must be "${expected}" (found "${actual}").`, 0, 0, 1));
      }
    }

    // PT011: @style must equal "unicode"
    if (rules.PT011.enabled) {
      const expected = (rules.PT011.raw && typeof rules.PT011.raw === 'object' && 'expected' in rules.PT011.raw)
        ? String((rules.PT011.raw as any).expected)
        : 'unicode';
      const actual = (doc.directives['style'] ?? '').trim();
      if (!actual) {
        msgs.push(mkMsg('PT011', rules.PT011.severity, 'Missing required directive: @style: unicode', 0, 0, 1));
      } else if (actual !== expected) {
        msgs.push(mkMsg('PT011', rules.PT011.severity, `@style must be "${expected}" (found "${actual}").`, 0, 0, 1));
      }
    }

    // PT012: @version must be semver
    if (rules.PT012.enabled) {
      const actual = (doc.directives['version'] ?? '').trim();
      if (!actual) {
        msgs.push(mkMsg('PT012', rules.PT012.severity, 'Missing required directive: @version: <SEMVER>', 0, 0, 1));
      } else if (!isSemver(actual)) {
        msgs.push(mkMsg('PT012', rules.PT012.severity, `@version must be SEMVER (found "${actual}").`, 0, 0, 1));
      }
    }

    // PT013: @name_type block must exist and match expected mapping
    if (rules.PT013.enabled) {
      const raw = doc.directives['name_type'];
      const parsed = raw ? parseNameTypeDirective(raw) : null;

      const expectedObj = (rules.PT013.raw && typeof rules.PT013.raw === 'object' && 'expected' in rules.PT013.raw)
        ? (rules.PT013.raw as any).expected as Record<string, string>
        : { ROOT: 'SCREAM_TYPE', DIR: 'High_Type', FILE: 'smol-type' };

      if (!raw || !parsed) {
        msgs.push(mkMsg('PT013', rules.PT013.severity, 'Missing or invalid @name_type block. Expected ROOT/DIR/FILE mapping.', 0, 0, 1));
      } else {
        for (const k of Object.keys(expectedObj)) {
          const got = parsed[k];
          const exp = expectedObj[k];
          if (!got) {
            msgs.push(mkMsg('PT013', rules.PT013.severity, `@name_type is missing ${k}: '${exp}'.`, 0, 0, 1));
          } else if (got !== exp) {
            msgs.push(mkMsg('PT013', rules.PT013.severity, `@name_type ${k} must be '${exp}' (found '${got}').`, 0, 0, 1));
          }
        }
      }
    }

    // PT014: @separation_delimiters list must exist and match expected set
    if (rules.PT014.enabled) {
      const raw = doc.directives['separation_delimiters'] ?? doc.directives['seperation_delimiters'];
      const parsed = raw ? parseDelimiterListDirective(raw) : null;

      const expected = (rules.PT014.raw && typeof rules.PT014.raw === 'object' && 'expected' in rules.PT014.raw)
        ? (rules.PT014.raw as any).expected as string[]
        : ['-', '_', '.'];

      if (!raw || !parsed) {
        msgs.push(mkMsg('PT014', rules.PT014.severity, 'Missing or invalid @separation_delimiters list.', 0, 0, 1));
      } else {
        const a = [...new Set(parsed)];
        const exp = [...new Set(expected)];
        const missing = exp.filter(d => !a.includes(d));
        const extra = a.filter(d => !exp.includes(d));

        if (missing.length > 0) {
          msgs.push(mkMsg('PT014', rules.PT014.severity, `@separation_delimiters missing: ${missing.join(', ')}`, 0, 0, 1));
        }
        if (extra.length > 0) {
          msgs.push(mkMsg('PT014', rules.PT014.severity, `@separation_delimiters contains unknown delimiters: ${extra.join(', ')}`, 0, 0, 1));
        }
      }
    }
  }

// PT001: root marker
  if (rules.PT001.enabled) {
    if (!doc.root) {
      msgs.push(mkMsg('PT001', rules.PT001.severity, 'Missing root line. Expected a root label ending with "//" or a root path ending with "/".', 0, 0, 1));
    } else {
      const marker = (typeof rules.PT001.raw === 'object' && typeof (rules.PT001.raw as any).root_marker === 'string')
        ? (rules.PT001.raw as any).root_marker
        : '//';

      if (marker === '//' && doc.root.kind !== 'rootLabel') {
        msgs.push(mkMsg('PT001', rules.PT001.severity, 'Root line should be a root label ending with "//" (default ruleset).', doc.root.line, doc.root.startCol, doc.root.endCol));
      }
    }
  }


  // PT015: spec root label must be "PTREE-<@version>//"
  if (isSpec && rules.PT015.enabled) {
    const expectedRootBase = (rules.PT015.raw && typeof rules.PT015.raw === 'object' && 'expected_root_base' in rules.PT015.raw)
      ? String((rules.PT015.raw as any).expected_root_base)
      : 'PTREE';

    const declaredVersion = (doc.directives['version'] ?? '').trim();

    if (!doc.root) {
      msgs.push(mkMsg('PT015', rules.PT015.severity, 'Missing root label line (expected PTREE-<@version>//).', 0, 0, 1));
    } else {
      const rootRaw = doc.root.value.trimEnd();
      if (!rootRaw.endsWith('//')) {
        msgs.push(mkMsg('PT015', rules.PT015.severity, 'Root label must end with // in spec mode.', doc.root.line, doc.root.startCol, doc.root.endCol));
      } else {
        const rootLabel = rootRaw.slice(0, -2);
        const { base, version } = splitVersion(rootLabel);

        if (base !== expectedRootBase) {
          msgs.push(mkMsg('PT015', rules.PT015.severity, `Root label base must be "${expectedRootBase}" (found "${base}").`, doc.root.line, doc.root.startCol, doc.root.endCol));
        }

        if (declaredVersion && version && declaredVersion !== version) {
          msgs.push(mkMsg('PT015', rules.PT015.severity, `Root label version "${version}" must match @version "${declaredVersion}".`, doc.root.line, doc.root.startCol, doc.root.endCol));
        } else if (declaredVersion && !version) {
          msgs.push(mkMsg('PT015', rules.PT015.severity, `Root label must include version delimiter and version (expected ${expectedRootBase}-\${@version}//).`, doc.root.line, doc.root.startCol, doc.root.endCol));
        }
      }
    }
  }

  // PT002: directories must end with /
  if (rules.PT002.enabled) {
    const mode = (typeof rules.PT002.raw === 'object' && typeof (rules.PT002.raw as any).mode === 'string')
      ? (rules.PT002.raw as any).mode
      : 'parents';

    for (const node of doc.nodes) {
      if (mode === 'parents' && !node.hasChildren) continue;
      const kind = classifyNode(node.name);
      if (kind === 'FILE' && node.hasChildren) {
        const sp = nodeSpan(node);
        msgs.push(mkMsg('PT002', rules.PT002.severity, 'Parent node has children but does not end with "/" (directory marker).', sp.line, sp.startCol, sp.endCol));
      }
    }
  }

  // PT006: no spaces in node names
  if (rules.PT006.enabled) {
    for (const node of doc.nodes) {
      if (node.name.includes(' ')) {
        const sp = nodeSpan(node);
        msgs.push(mkMsg('PT006', rules.PT006.severity, 'Spaces are not allowed in node names in the default ruleset. Use "-" or "_".', sp.line, sp.startCol, sp.endCol));
      }
    }
  }

  // PT007: extension lowercase
  if (rules.PT007.enabled) {
    for (const node of doc.nodes) {
      if (classifyNode(node.name) !== 'FILE') continue;
      const { ext } = splitFileParts(node.name, fileSplit);
      if (!ext) continue;
      if (ext !== ext.toLowerCase()) {
        const sp = nodeSpan(node);
        msgs.push(mkMsg('PT007', rules.PT007.severity, `File extension should be lowercase (found: .${ext}).`, sp.line, sp.startCol, sp.endCol));
      }
    }
  }

  // PT008: do not mix '-' and '_'
  if (rules.PT008.enabled) {
    for (const node of doc.nodes) {
      const kind = classifyNode(node.name);
      if (kind === 'META') continue;

      const bare = stripTrailingMarkers(node.name);
      const fileBase = kind === 'FILE' ? splitFileParts(bare, fileSplit).stem : bare;
      const { base } = splitVersion(fileBase);

      if (base.includes('-') && base.includes('_')) {
        const sp = nodeSpan(node);
        msgs.push(mkMsg('PT008', rules.PT008.severity, "Do not mix '-' and '_' in the same bare name.", sp.line, sp.startCol, sp.endCol));
      }
    }
  }

  // PT004/PT005: NAME_TYPES + version delimiter rule
  const allowedByEntity = config.ENTITY_NAME_TYPES ?? {};
  const nameTypes = config.NAME_TYPES ?? {};

  if (rules.PT004.enabled || rules.PT005.enabled) {
    // ROOT
    if (doc.root) {
      const rootRaw = doc.root.value.trimEnd();
      const rootLabel = rootRaw.endsWith('//') ? rootRaw.slice(0, -2) : rootRaw.replace(/\/$/, '');
      const { base: rootBase, versionDelimiter, version } = splitVersion(rootLabel);

      if (rules.PT004.enabled) {
        const match = findMatchingNameTypeId(rootBase, allowedByEntity.ROOT, nameTypes);
        if (!match) {
          msgs.push(mkMsg('PT004', rules.PT004.severity, `Root name "${rootBase}" does not match any allowed ROOT NAME_TYPES.`, doc.root.line, doc.root.startCol, doc.root.endCol));
        }
      }

      if (rules.PT005.enabled && versionDelimiter && version) {
        const match = findMatchingNameTypeId(rootBase, allowedByEntity.ROOT, nameTypes);
        if (match) {
          const def = nameTypes[match];
          if (def.word_delimiter && def.word_delimiter === versionDelimiter) {
            msgs.push(mkMsg('PT005', rules.PT005.severity, `Version delimiter "${versionDelimiter}" must not match the ${match} word delimiter "${def.word_delimiter}".`, doc.root.line, doc.root.startCol, doc.root.endCol));
          }
          if (!def.allowed_version_delimiters.includes(versionDelimiter)) {
            msgs.push(mkMsg('PT005', rules.PT005.severity, `Version delimiter "${versionDelimiter}" is not allowed for NAME_TYPE ${match}.`, doc.root.line, doc.root.startCol, doc.root.endCol));
          }
        }
      }
    }

    // NODES
    for (const node of doc.nodes) {
      const sp = nodeSpan(node);
      const kind = classifyNode(node.name);

      const entity = kind;
      const allowed = allowedByEntity[entity] ?? [];

      // Skip type checks if there's no declared allowed types for this entity.
      if (allowed.length === 0) continue;

      const bareWithExt = stripTrailingMarkers(node.name);
      let fileBase = kind === 'FILE' ? splitFileParts(bareWithExt, fileSplit).stem : bareWithExt;

      // For index files, validate only the remainder after the (index) prefix
      if (kind === 'FILE' && node.isIndexFile) {
        const { remainder } = parseIndexFile(fileBase);
        // If remainder is empty (just "(index)"), skip NAME_TYPE validation
        if (remainder === '') {
          continue;
        }
        // Validate the remainder against FILE NAME_TYPE rules
        fileBase = remainder;
      }

      const { base, versionDelimiter, version } = splitVersion(fileBase);

      if (rules.PT004.enabled) {
        const match = findMatchingNameTypeId(base, allowed, nameTypes);
        if (!match) {
          msgs.push(mkMsg('PT004', rules.PT004.severity, `${entity} name "${base}" does not match any allowed NAME_TYPES (${allowed.join(', ')}).`, sp.line, sp.startCol, sp.endCol));
        }
      }

      if (rules.PT005.enabled && versionDelimiter && version) {
        const match = findMatchingNameTypeId(base, allowed, nameTypes);
        if (match) {
          const def = nameTypes[match];
          if (def.word_delimiter && def.word_delimiter === versionDelimiter) {
            msgs.push(mkMsg('PT005', rules.PT005.severity, `Version delimiter "${versionDelimiter}" must not match the ${match} word delimiter "${def.word_delimiter}".`, sp.line, sp.startCol, sp.endCol));
          }
          if (!def.allowed_version_delimiters.includes(versionDelimiter)) {
            msgs.push(mkMsg('PT005', rules.PT005.severity, `Version delimiter "${versionDelimiter}" is not allowed for NAME_TYPE ${match}.`, sp.line, sp.startCol, sp.endCol));
          }
        }
      }
    }
  }

  // PT009 sorting (disabled by default)
  if (rules.PT009.enabled) {
    const caseSensitive = (typeof rules.PT009.raw === 'object' && typeof (rules.PT009.raw as any).case_sensitive === 'boolean')
      ? (rules.PT009.raw as any).case_sensitive
      : false;

    // Group nodes by parent (pre-order traversal + depth stack).
    const parentStack: number[] = [];
    const childrenByParent = new Map<string, number[]>();

    for (let i = 0; i < doc.nodes.length; i++) {
      const node = doc.nodes[i];

      while (parentStack.length > node.depth) parentStack.pop();

      const parentKey = node.depth === 0 ? 'ROOT' : String(parentStack[node.depth - 1]);
      const arr = childrenByParent.get(parentKey) ?? [];
      arr.push(i);
      childrenByParent.set(parentKey, arr);

      parentStack[node.depth] = i;
      parentStack.length = node.depth + 1;
    }

    const keyOf = (idx: number): string => {
      const n = doc.nodes[idx];
      const kind = classifyNode(n.name);
      const bare = stripTrailingMarkers(n.name);
      const base = kind === 'FILE' ? splitFileParts(bare, fileSplit).stem : bare;
      return base;
    };

    const cmp = (aIdx: number, bIdx: number): number => {
      const a = doc.nodes[aIdx];
      const b = doc.nodes[bIdx];

      // Rank: DIR before FILE. META stays with DIR.
      const aKind = classifyNode(a.name);
      const bKind = classifyNode(b.name);
      const aRank = aKind === 'FILE' ? 1 : 0;
      const bRank = bKind === 'FILE' ? 1 : 0;
      if (aRank !== bRank) return aRank - bRank;

      const ak = keyOf(aIdx);
      const bk = keyOf(bIdx);
      const A = caseSensitive ? ak : ak.toLowerCase();
      const B = caseSensitive ? bk : bk.toLowerCase();
      if (A < B) return -1;
      if (A > B) return 1;
      return 0;
    };

    for (const [, childIndices] of childrenByParent) {
      for (let j = 1; j < childIndices.length; j++) {
        const prev = childIndices[j - 1];
        const curr = childIndices[j];
        if (cmp(prev, curr) > 0) {
          const n = doc.nodes[curr];
          msgs.push(mkMsg('PT009', rules.PT009.severity, 'Sibling ordering violation: expected directories first, then files; each group lexicographically.', n.line, n.startCol, Math.max(n.startCol + 1, n.endCol)));
        }
      }
    }
  }

  return msgs;
}

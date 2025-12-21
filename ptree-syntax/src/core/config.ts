import * as fs from 'fs';
import * as path from 'path';

export type Severity = 'error' | 'warning' | 'info';

export type NameTypeDef = {
  description?: string;
  word_delimiter: string | null;
  allowed_version_delimiters: string[];
  pattern: string; // regex source for bare name
  examples?: string[];
  with_number_examples?: string[];
};

export type RuleSetting = boolean | {
  enabled?: boolean;
  severity?: Severity;
  description?: string;
  // rule-specific fields allowed
  [key: string]: unknown;
};

export type PtreeConfig = {
  $schema?: string;
  ptree: string;
  style: 'unicode' | 'ascii' | string;
  profile?: string;
  FILE_EXTENSION_SPLIT?: 'lastDot' | 'firstDot' | string;
  NAME_TYPES: Record<string, NameTypeDef>;
  SEPERATION_DELIMITERS?: string[];
  SEPARATION_DELIMITERS?: string[];
  ENTITY_NAME_TYPES?: Record<string, string[]>;
  RULES?: Record<string, RuleSetting> & { default?: boolean };
};

const USER_CONFIG_CANDIDATES = ['.ptreerc.json', '.ptree.json', 'ptree.config.json'];

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export type ConfigProfile = 'default' | 'spec';

export function getConfigPath(projectRoot: string, profile: ConfigProfile = 'default'): string {
  const file = profile === 'spec' ? 'ptree.spec-config.json' : 'ptree.default-config.json';
  return path.join(projectRoot, 'config', file);
}

export function loadProfileConfig(projectRoot: string, profile: ConfigProfile = 'default'): PtreeConfig {
  const p = getConfigPath(projectRoot, profile);
  return readJsonFile<PtreeConfig>(p);
}


export function findUserConfigPath(workspaceRoot: string): string | undefined {
  for (const name of USER_CONFIG_CANDIDATES) {
    const p = path.join(workspaceRoot, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, any>>(base: T, override: Record<string, any>): T {
  const out: any = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function loadEffectiveConfig(projectRoot: string, workspaceRoot?: string, profile: ConfigProfile = 'default'): {
  config: PtreeConfig;
  defaultConfigPath: string;
  userConfigPath?: string;
} {
  const defaultConfigPath = getConfigPath(projectRoot, profile);
  const base = loadProfileConfig(projectRoot, profile);

  if (!workspaceRoot) {
    return { config: base, defaultConfigPath };
  }

  const userConfigPath = findUserConfigPath(workspaceRoot);
  if (!userConfigPath) {
    return { config: base, defaultConfigPath };
  }

  const user = readJsonFile<Partial<PtreeConfig>>(userConfigPath);

  // Merge in a targeted way to keep NAME_TYPES/RULES/ENTITY_NAME_TYPES centrally managed.
  const merged: PtreeConfig = deepMerge(base as any, user as any);

  return { config: merged, defaultConfigPath, userConfigPath };
}
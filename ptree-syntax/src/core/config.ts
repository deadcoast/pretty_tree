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

/**
 * Error thrown when JSON parsing fails, includes file path and position information.
 */
export class JsonParseError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly line?: number,
    public readonly column?: number
  ) {
    const posInfo = line !== undefined && column !== undefined
      ? ` at line ${line}, column ${column}`
      : '';
    super(`Failed to parse JSON file "${filePath}"${posInfo}: ${message}`);
    this.name = 'JsonParseError';
  }
}

/**
 * Parse position information from a JSON.parse SyntaxError message.
 * Different JS engines format the error differently, so we try multiple patterns.
 */
function parseJsonErrorPosition(error: SyntaxError, content: string): { line?: number; column?: number } {
  const msg = error.message;
  
  // Try to extract position from error message
  // V8/Node: "Unexpected token } in JSON at position 123"
  // SpiderMonkey: "JSON.parse: expected ',' or '}' after property value in object at line 5 column 3"
  
  // Pattern 1: "at position N"
  const posMatch = msg.match(/at position (\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    // Convert position to line/column
    let line = 1;
    let column = 1;
    for (let i = 0; i < pos && i < content.length; i++) {
      if (content[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    return { line, column };
  }
  
  // Pattern 2: "at line N column M"
  const lineColMatch = msg.match(/at line (\d+) column (\d+)/i);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10)
    };
  }
  
  // Pattern 3: "line N"
  const lineMatch = msg.match(/line (\d+)/i);
  if (lineMatch) {
    return { line: parseInt(lineMatch[1], 10) };
  }
  
  return {};
}

const USER_CONFIG_CANDIDATES = ['.ptreerc.json', '.ptree.json', 'ptree.config.json'];

/**
 * Read and parse a JSON file with enhanced error reporting.
 * @throws {JsonParseError} If the file cannot be parsed, includes file path and position
 */
function readJsonFile<T>(filePath: string): T {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new JsonParseError(`Unable to read file: ${message}`, filePath);
  }
  
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    if (err instanceof SyntaxError) {
      const { line, column } = parseJsonErrorPosition(err, raw);
      throw new JsonParseError(err.message, filePath, line, column);
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new JsonParseError(message, filePath);
  }
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
  const merged: PtreeConfig = deepMerge(base as any, user as unknown);

  return { config: merged, defaultConfigPath, userConfigPath };
}
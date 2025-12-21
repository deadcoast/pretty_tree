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
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {return p;}
  }
  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep merge two objects. Override values take precedence.
 * For nested objects, the merge is recursive.
 * @param base The base object
 * @param override The override object
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(override)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
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
  const merged: PtreeConfig = deepMerge(base as Record<string, unknown>, user as Record<string, unknown>) as PtreeConfig;

  return { config: merged, defaultConfigPath, userConfigPath };
}

/**
 * Represents a configuration validation error.
 */
export type ConfigValidationError = {
  type: 'unknown_name_type' | 'invalid_rule_setting';
  message: string;
  entity?: string;
  nameType?: string;
  rule?: string;
  field?: string;
};

/**
 * Validates that all NAME_TYPE references in ENTITY_NAME_TYPES exist in NAME_TYPES.
 * @param config The configuration to validate
 * @returns Array of validation errors for unknown NAME_TYPE references
 */
export function validateNameTypeReferences(config: PtreeConfig): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const definedNameTypes = new Set(Object.keys(config.NAME_TYPES));
  
  if (config.ENTITY_NAME_TYPES) {
    for (const [entity, nameTypes] of Object.entries(config.ENTITY_NAME_TYPES)) {
      for (const nameType of nameTypes) {
        if (!definedNameTypes.has(nameType)) {
          errors.push({
            type: 'unknown_name_type',
            message: `ENTITY_NAME_TYPES.${entity} references unknown NAME_TYPE "${nameType}"`,
            entity,
            nameType
          });
        }
      }
    }
  }
  
  return errors;
}

/** Valid rule IDs that can be configured */
const VALID_RULE_IDS = [
  'default', 'PT001', 'PT002', 'PT003', 'PT004', 'PT005',
  'PT006', 'PT007', 'PT008', 'PT009', 'PT010', 'PT011',
  'PT012', 'PT013', 'PT014', 'PT015'
];

/** Valid severity values */
const VALID_SEVERITIES: Severity[] = ['error', 'warning', 'info'];

/**
 * Validates rule settings in the configuration.
 * @param config The configuration to validate
 * @returns Array of validation errors for invalid rule settings
 */
export function validateRuleSettings(config: PtreeConfig): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  
  if (!config.RULES) {
    return errors;
  }
  
  for (const [ruleId, setting] of Object.entries(config.RULES)) {
    // Check if rule ID is valid
    if (!VALID_RULE_IDS.includes(ruleId)) {
      errors.push({
        type: 'invalid_rule_setting',
        message: `Unknown rule "${ruleId}" in RULES configuration`,
        rule: ruleId
      });
      continue;
    }
    
    // Skip 'default' which is just a boolean
    if (ruleId === 'default') {
      if (typeof setting !== 'boolean') {
        errors.push({
          type: 'invalid_rule_setting',
          message: `RULES.default must be a boolean, got ${typeof setting}`,
          rule: ruleId,
          field: 'default'
        });
      }
      continue;
    }
    
    // Validate rule setting structure
    if (typeof setting === 'boolean') {
      // Simple boolean enable/disable is valid
      continue;
    }
    
    if (!isPlainObject(setting)) {
      errors.push({
        type: 'invalid_rule_setting',
        message: `RULES.${ruleId} must be a boolean or object, got ${typeof setting}`,
        rule: ruleId
      });
      continue;
    }
    
    // Validate 'enabled' field if present
    if ('enabled' in setting && typeof setting.enabled !== 'boolean') {
      errors.push({
        type: 'invalid_rule_setting',
        message: `RULES.${ruleId}.enabled must be a boolean, got ${typeof setting.enabled}`,
        rule: ruleId,
        field: 'enabled'
      });
    }
    
    // Validate 'severity' field if present
    if ('severity' in setting) {
      const sev = setting.severity as string;
      if (!VALID_SEVERITIES.includes(sev as Severity)) {
        errors.push({
          type: 'invalid_rule_setting',
          message: `RULES.${ruleId}.severity must be one of ${VALID_SEVERITIES.join(', ')}, got "${sev}"`,
          rule: ruleId,
          field: 'severity'
        });
      }
    }
    
    // Validate 'description' field if present
    if ('description' in setting && typeof setting.description !== 'string') {
      errors.push({
        type: 'invalid_rule_setting',
        message: `RULES.${ruleId}.description must be a string, got ${typeof setting.description}`,
        rule: ruleId,
        field: 'description'
      });
    }
  }
  
  return errors;
}

/**
 * Validates the entire configuration and returns all validation errors.
 * @param config The configuration to validate
 * @returns Array of all validation errors
 */
export function validateConfig(config: PtreeConfig): ConfigValidationError[] {
  return [
    ...validateNameTypeReferences(config),
    ...validateRuleSettings(config)
  ];
}
import * as assert from 'assert';
import * as fc from 'fast-check';
import * as path from 'path';
import { loadProfileConfig, NameTypeDef } from '../../core/config';

/**
 * **Feature: ptree-completion, Property 2: NAME_TYPE Pattern-Example Consistency**
 * **Validates: Requirements 1.2**
 * 
 * For any NAME_TYPE definition, all provided examples should match the defined pattern regex.
 */
suite('NAME_TYPE Property Tests', () => {
  const projectRoot = path.resolve(__dirname, '../../..');
  
  test('Property 2: NAME_TYPE Pattern-Example Consistency - all examples match their pattern', () => {
    // Load both configs
    const defaultConfig = loadProfileConfig(projectRoot, 'default');
    const specConfig = loadProfileConfig(projectRoot, 'spec');
    
    // Collect all NAME_TYPE definitions from both configs
    const allNameTypes: Array<{ configName: string; typeName: string; def: NameTypeDef }> = [];
    
    for (const [typeName, def] of Object.entries(defaultConfig.NAME_TYPES)) {
      allNameTypes.push({ configName: 'default', typeName, def });
    }
    
    for (const [typeName, def] of Object.entries(specConfig.NAME_TYPES)) {
      allNameTypes.push({ configName: 'spec', typeName, def });
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...allNameTypes),
        ({ configName, typeName, def }) => {
          const regex = new RegExp(def.pattern);
          
          // Check all examples match the pattern
          const examples = def.examples || [];
          for (const example of examples) {
            const matches = regex.test(example);
            if (!matches) {
              return false;
            }
          }
          
          // Check all with_number_examples contain the base pattern
          // (these have version suffixes, so we check the base name portion)
          const withNumberExamples = def.with_number_examples || [];
          for (const example of withNumberExamples) {
            // Extract base name by removing version suffix
            // Version suffixes are like -1.0.0 or _1.0.0
            const versionMatch = example.match(/^(.+?)[-_]\d+\.\d+\.\d+$/);
            if (versionMatch) {
              const baseName = versionMatch[1];
              const matches = regex.test(baseName);
              if (!matches) {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: NAME_TYPE Pattern-Example Consistency - detailed assertions', () => {
    // Load both configs
    const defaultConfig = loadProfileConfig(projectRoot, 'default');
    const specConfig = loadProfileConfig(projectRoot, 'spec');
    
    const configs = [
      { name: 'default', config: defaultConfig },
      { name: 'spec', config: specConfig }
    ];
    
    for (const { name: configName, config } of configs) {
      for (const [typeName, def] of Object.entries(config.NAME_TYPES)) {
        const regex = new RegExp(def.pattern);
        
        // Check all examples match the pattern
        const examples = def.examples || [];
        for (const example of examples) {
          assert.ok(
            regex.test(example),
            `[${configName}] NAME_TYPE "${typeName}" example "${example}" does not match pattern "${def.pattern}"`
          );
        }
        
        // Check all with_number_examples contain the base pattern
        const withNumberExamples = def.with_number_examples || [];
        for (const example of withNumberExamples) {
          // Extract base name by removing version suffix
          const versionMatch = example.match(/^(.+?)[-_]\d+\.\d+\.\d+$/);
          if (versionMatch) {
            const baseName = versionMatch[1];
            assert.ok(
              regex.test(baseName),
              `[${configName}] NAME_TYPE "${typeName}" with_number_example "${example}" base name "${baseName}" does not match pattern "${def.pattern}"`
            );
          }
        }
      }
    }
  });
});

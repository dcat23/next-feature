import { ConfigGeneratorSchema, NormalizedCodeGeneratorSchema } from '../types';
import { normalizeCodeGenerator } from './code-generator';

/**
 * [normalize-config-generator]
 * next-feature@0.1.0
 * November 9th 2025, 3:12:54 pm
 */
export function normalizeConfigGenerator<T extends ConfigGeneratorSchema>(options: T): NormalizedCodeGeneratorSchema<T> {
  const normalized = normalizeCodeGenerator(options)
  return {
    ...normalized,
    outputFileName: ""
  };
}

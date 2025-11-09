import { ConfigGeneratorSchema, NormalizedCodeGeneratorSchema } from '../types';
import { names } from '@nx/devkit';

/**
 * [normalize-config-generator]
 * next-feature@0.1.0
 * November 9th 2025, 3:12:54 pm
 */
export function normalizeConfigGenerator<T extends ConfigGeneratorSchema>(options: T): NormalizedCodeGeneratorSchema<T> {
  return {
    tmpl: "",
    ...options,
    names: names(options.name),
    outputFileName: ""
  };
}

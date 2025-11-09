import {
  ClientGeneratorSchema,
  NormalizedClientGeneratorSchema,
} from '../schema';
import { normalizeProjectGenerator } from '../../../../lib/utils/project-generator';

/**
 * [normalize]
 * next-feature@0.0.12
 * November 9th 2025, 3:04:04 am
 */
export function normalize(options: ClientGeneratorSchema): NormalizedClientGeneratorSchema {
  const normalized = normalizeProjectGenerator(options, "client");

  return {
    ...normalized
  };
}

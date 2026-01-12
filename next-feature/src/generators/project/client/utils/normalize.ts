import {
  ClientGeneratorSchema,
  NormalizedClientGeneratorSchema,
} from '../schema';
import { normalizeProjectGeneratorSchema } from '../../../../lib/utils/project-generator';

/**
 * [normalize-client-generator]
 * next-feature@0.1.1-beta.5
 * January 10th 2026, 9:14:51 pm
 */
export function normalizeClientGenerator(
  options: ClientGeneratorSchema
): NormalizedClientGeneratorSchema {
  const normalized = normalizeProjectGeneratorSchema(options, "client");

  return {
    ...normalized
  };
}

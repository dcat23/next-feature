import {
  FeatureGeneratorSchema,
  FeatureType,
  type NormalizedFeatureGeneratorSchema,
} from '../schema';
import { normalizeProjectGeneratorSchema } from '../../../../lib/utils/project-generator';
import { asApiKeyName } from './index';

/**
 * [normalize-feature-generator]
 * next-feature@0.1.1-beta.5
 * January 10th 2026, 8:57:19 pm
 */
export function normalizeFeatureGenerator(
  options: FeatureGeneratorSchema
): NormalizedFeatureGeneratorSchema {
  const normalized = normalizeProjectGeneratorSchema(options, "feature");
  const apiKeyName = asApiKeyName(options.name)

  let type: FeatureType = normalized.type ?? 'generic';
  if (type === 'generic') {
    switch (normalized.name) {
      case 'client':
      case 'auth':
      case 'base':
      case 'logging':
        type = normalized.name;
        break;
    }
  }

  return {
    ...normalized,
    apiKeyName,
    type,
  };
}

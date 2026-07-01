import {
  FeatureGeneratorSchema,
  FeatureType,
  type NormalizedFeatureGeneratorSchema,
} from '../schema';
import { normalizeProjectGeneratorSchema } from '../../../../lib/utils/project-generator';
import { asApiKeyName } from '../../../misc/axios/utils';

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

  let type: FeatureType = options.type ?? 'generic';
  if (type === 'generic') {
    switch (options.name) {
      case 'base':
      case 'logging':
        type = options.name;
        break;
    }
  }


  return {
    ...normalized,
    directory: normalized.directory as string,
    apiKeyName,
    type
  };
}

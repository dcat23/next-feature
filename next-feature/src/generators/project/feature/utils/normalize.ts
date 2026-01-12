import {
  FeatureGeneratorSchema,
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

  return {
    ...normalized,
    apiKeyName
  };
}

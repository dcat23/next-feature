import { names } from '@nx/devkit';
import type { AxiosGeneratorSchema, NormalizedAxiosGeneratorSchema } from '../schema';
import { normalizeCodeGenerator } from '../../../../lib/utils/code-generator';

/**
 * [as-api-key-name]
 * August 2nd 2025, 1:47:53 pm
 */
export function asApiKeyName(name: string) {
  const { constantName } = names(name);
  return constantName.concat('_API_URL');
}

/**
 * [as-api-name]
 * next-feature@0.0.10
 * September 1st 2025, 4:21:02 pm
 */
export function asApiName(name: string) {
  const { fileName } = names(name);
  return names(fileName.concat('-api')).propertyName;
}

/**
 * [normalize]
 * next-feature@0.1.0
 * November 9th 2025, 10:36:28 pm
 */
export function normalize(
  options: AxiosGeneratorSchema
): NormalizedAxiosGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  const keyName = asApiKeyName(normalized.name);
  const apiName = asApiName(normalized.name);
  normalized.projectName ??= normalized.name;
  normalized.useInterceptor = Boolean(normalized.useInterceptor);

  return {
    ...normalized,
    keyName,
    apiName
  };
}

import { names } from '@nx/devkit';

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

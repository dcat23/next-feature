import { names } from '@nx/devkit';

/**
 * [as-api-key-name]
 * August 2nd 2025, 1:47:53 pm
 */
export function asApiKeyName(name: string) {
  const { constantName } = names(name)
  return constantName.concat("_API_URL");
}

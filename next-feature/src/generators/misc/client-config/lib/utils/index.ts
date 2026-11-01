import { names } from '@nx/devkit';
import { normalizeCodeGenerator } from '../../../../../lib/utils/code-generator';
import { asApiKeyName } from '../../../../project/feature/utils';
import type {
  ClientConfigGeneratorSchema,
  NormalizedClientConfigGeneratorSchema,
} from '../types';

export const DEFAULT_CLIENT_NAME = 'api';
export const DEFAULT_CLIENT_PACKAGE = '@next-feature/client';
export const CLIENT_CONFIG_PACKAGE = 'lib/config';
export const CLIENT_CONFIG_FILE = 'client';

/**
 * Env var holding a client's base URL. The default client keeps the
 * project-based name (`<PROJECT>_API_URL`) earlier versions generated;
 * named clients get their own (`<NAME>_API_URL`).
 */
export function asClientEnvVar(projectName: string, clientName: string, envVar?: string) {
  if (envVar) return names(envVar).constantName;
  return asApiKeyName(clientName === DEFAULT_CLIENT_NAME ? projectName : clientName);
}

/**
 * Normalize client-config generator options. Every client lives in
 * lib/config/client.ts, so `package` and `file` are fixed.
 */
export function normalize(
  options: ClientConfigGeneratorSchema
): NormalizedClientConfigGeneratorSchema {
  const normalized = normalizeCodeGenerator({
    ...options,
    name: options.name || DEFAULT_CLIENT_NAME,
    package: CLIENT_CONFIG_PACKAGE,
    file: CLIENT_CONFIG_FILE,
  });

  const clientName = normalized.names.propertyName;

  return {
    ...normalized,
    clientName,
    isDefault: clientName === DEFAULT_CLIENT_NAME,
    clientImportPath: options.clientPackage || DEFAULT_CLIENT_PACKAGE,
  };
}

import { readProjectConfiguration, Tree } from '@nx/devkit';
import { asApiKeyName } from '../../../../project/feature/utils';
import type {
  ClientConfigGeneratorSchema,
  NormalizedClientConfigGeneratorSchema,
} from '../types';

/**
 * Normalize client-config generator options
 */
export async function normalize(
  tree: Tree,
  options: ClientConfigGeneratorSchema
): Promise<NormalizedClientConfigGeneratorSchema> {
  if (!options.projectName) {
    throw new Error('projectName is required for client-config generator');
  }

  const projectConfig = readProjectConfiguration(tree, options.projectName);
  const sourceRoot = projectConfig.sourceRoot || `${projectConfig.root}/src`;
  const projectPath = projectConfig.root;

  const clientImportPath = options.clientPackage || '@next-feature/client';

  return {
    ...options,
    projectPath,
    sourceRoot,
    clientImportPath,
    apiKeyName: asApiKeyName(options.projectName),
  };
}

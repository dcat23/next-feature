import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import type { ClientConfigGeneratorSchema } from './schema';
import { normalize } from './lib/utils';
import { PLUGIN_VERSION } from '../../../lib/constants/versions';
import { updateEnvConfig } from '../../../lib/dotenv/env-config';
import { updateDependencies } from '../../../lib/utils';

/**
 * Client config generator
 *
 * Creates a centralized client configuration file (lib/client/config.ts)
 * that sets up the ApiClient with defaults and re-exports utilities.
 *
 * This is typically auto-invoked by action generators to ensure a config exists.
 */
export async function clientConfigGenerator(
  tree: Tree,
  options: ClientConfigGeneratorSchema
): Promise<GeneratorCallback> {
  const normalizedOptions = await normalize(tree, options);

  // Check if config already exists
  const configPath = path.join(
    normalizedOptions.sourceRoot,
    'lib/config/client.ts'
  );

  if (tree.exists(configPath)) {
    console.log(`Client config already exists at ${configPath}`);
    return async () => {};
  }

  // Add @next-feature/client dependency
  const dependencies: Record<string, string> = {
    "@next-feature/client": PLUGIN_VERSION
  };

  const dependenciesTask = updateDependencies(tree, dependencies, {});

  // Ensure the API URL var this config imports actually exists in env.ts.
  updateEnvConfig(tree, normalizedOptions.sourceRoot, {
    set: [normalizedOptions.apiKeyName],
  });

  // Generate the config file from template
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'src'),
    normalizedOptions.sourceRoot,
    {
      ...normalizedOptions,
      tmpl: '',
    }
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return dependenciesTask;
}

export default clientConfigGenerator;

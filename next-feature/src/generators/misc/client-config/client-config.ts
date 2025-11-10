import {
  formatFiles,
  generateFiles,
  Tree,
  type GeneratorCallback, addDependenciesToPackageJson,
} from '@nx/devkit';
import * as path from 'path';
import type { ClientConfigGeneratorSchema } from './schema';
import { normalize } from './lib/utils';
import { NEXT_FEATURE_CLIENT_VERSION } from '../../../lib/constants/versions';

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

  addDependenciesToPackageJson(
    tree,
    {
      "@next-feature/client": NEXT_FEATURE_CLIENT_VERSION
    },
    {}
  )
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

  return async () => {};
}

export default clientConfigGenerator;

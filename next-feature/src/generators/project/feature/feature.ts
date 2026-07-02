import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, runTasksInSerial, Tree } from '@nx/devkit';
import { libraryGenerator } from '@nx/next';
import * as path from 'path';
import { AXIOS_VERSION, NEXTAUTH_VERSION, PINO_HTTP_VERSION, PINO_PRETTY_VERSION, PINO_VERSION, SONNER_VERSION, ZOD_VERSION } from '../../../lib/constants/versions';
import { updateDotenv } from '../../../lib/dotenv/dot-env';
import { updateEnvConfig } from '../../../lib/dotenv/env-config';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';
import { initializeProjectGenerator, updateDependencies } from '../../../lib/utils';
import { FeatureGeneratorSchema } from './schema';
import { updatePackageJsonExports } from './utils';
import { normalizeFeatureGenerator } from './utils/normalize';

export async function featureGenerator(
  tree: Tree,
  options: FeatureGeneratorSchema
) {
  const normalizedOptions = normalizeFeatureGenerator(options);
  const tasks: GeneratorCallback[] = [];

  tasks.push(await libraryGenerator(tree, {
    directory: normalizedOptions.directory,
    name: normalizedOptions.name,
    importPath: normalizedOptions.importPath,
    bundler: 'vite',
    publishable: true,
    style: 'tailwind',
    unitTestRunner: 'jest',
    linter: "eslint",
    component: false,
    skipFormat: true,
    useProjectJson: true,
  }))

  updatePackageJsonExports(tree, normalizedOptions.projectRoot);

  tasks.push(await initializeProjectGenerator(tree, normalizedOptions, "feature"))

  const { sourceRoot, importPath, type, projectRoot, apiKeyName } = normalizedOptions;

  writeWildCardPathToTsConfig(tree, importPath, sourceRoot);

  /* Update dependencies */
  const dependencies: Record<string, string> = {
    sonner: SONNER_VERSION,
    zod: ZOD_VERSION
  };

  const devDependencies: Record<string, string> = {};

  switch (type) {
    case 'logging':
      // Handle logging-specific logic
      dependencies['pino'] = PINO_VERSION;
      dependencies['pino-http'] = PINO_HTTP_VERSION;
      devDependencies['pino-pretty'] = PINO_PRETTY_VERSION;
      break;
    case 'client':
        // Handle client-specific logic
        dependencies['axios'] = AXIOS_VERSION;
      break;
    case 'auth':
      // Handle auth-specific logic
      dependencies['next-auth'] = NEXTAUTH_VERSION;
      break;
  }


  tasks.push(updateDependencies(tree, dependencies, devDependencies))

  /* Generate files */
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'src'),
    sourceRoot,
    normalizedOptions
  );

  if (type !== 'generic') {
    generateFiles(
      tree,
      path.join(__dirname, 'files', type),
      sourceRoot,
      normalizedOptions
    );
  }

  updateDotenv(
    tree,
    { projectRoot, section: 'axios' },
    { set: { [apiKeyName]: 'http://localhost:8080' }, skipExisting: true }
  );
  updateEnvConfig(tree, sourceRoot, { set: [apiKeyName] });

  /* Clean up */
  tree.delete(path.join(sourceRoot, "lib", "hello-server.tsx"));

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}


export default featureGenerator;

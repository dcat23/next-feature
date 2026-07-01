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
import { dotenvGenerator } from '../../misc/dotenv/dotenv';

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

  if (type === 'logging') {
    dependencies['pino'] = PINO_VERSION;
    dependencies['pino-http'] = PINO_HTTP_VERSION;
    devDependencies['pino-pretty'] = PINO_PRETTY_VERSION;
  } else if (type === 'client') {
    dependencies['axios'] = AXIOS_VERSION;
  } else if (type === 'auth') {
    dependencies['next-auth'] = NEXTAUTH_VERSION;
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

  if (normalizedOptions.env) {
    await dotenvGenerator(tree, {
      projectName: normalizedOptions.name,
      set: [
        `${apiKeyName}=http://localhost:8080`
      ],
      section: 'axios',
      skipFormat: true,
    })
  }

  /* Clean up */
  tree.delete(path.join(sourceRoot, "lib", "hello-server.tsx"));

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}


export default featureGenerator;

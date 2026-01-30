import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { ClientGeneratorSchema } from './schema';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';
import { AXIOS_VERSION, ZOD_VERSION } from '../../../lib/constants/versions';
import {
  initializeProjectGenerator,
  updateDependencies,
} from '../../../lib/utils';
import * as path from 'path';
import { libraryGenerator } from '@nx/next';
import { normalizeClientGenerator } from './utils/normalize';

export async function clientGenerator(
  tree: Tree,
  options: ClientGeneratorSchema
) {
  const normalizedOptions = normalizeClientGenerator(options);
  const tasks: GeneratorCallback[] = [];

  await libraryGenerator(tree, {
    directory: normalizedOptions.directory,
    name: normalizedOptions.name,
    importPath: normalizedOptions.importPath,
    bundler: 'vite',
    publishable: true,
    style: 'tailwind',
    unitTestRunner: 'jest',
    linter: 'eslint',
    component: false,
    skipFormat: true,
    useProjectJson: true,
  });

  await initializeProjectGenerator(tree, normalizedOptions, 'client');

  const { sourceRoot, importPath } = normalizedOptions;

  writeWildCardPathToTsConfig(tree, importPath, sourceRoot);
  tree.delete(path.join(sourceRoot, 'lib', 'hello-server.tsx'));

  const dependencies: Record<string, string> = {
    axios: AXIOS_VERSION,
    zod: ZOD_VERSION,
  };

  const devDependencies: Record<string, string> = {};

  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  generateFiles(
    tree,
    path.join(__dirname, 'files', 'src'),
    sourceRoot,
    normalizedOptions
  );

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default clientGenerator;

import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { ClientGeneratorSchema } from './schema';
import { normalize } from './utils';
import { libraryGenerator } from '@nx/next';
import { Linter } from '@nx/eslint';
import { updateTsConfig } from '../../../lib/ts-config';
import { removeLibFiles } from '../feature/utils';
import {
  AXIOS_VERSION,
  NEXT_FEATURE_CLIENT_VERSION,
  ZOD_VERSION,
} from '../../../lib/constants/versions';
import { updateDependencies } from '../../../lib/utils';
import * as path from 'path';

export async function clientGenerator(
  tree: Tree,
  options: ClientGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  tasks.push(await libraryGenerator(tree, {
    directory: normalizedOptions.directory,
    name: normalizedOptions.name,
    importPath: normalizedOptions.importPath,
    bundler: 'vite',
    style: 'tailwind',
    unitTestRunner: 'jest',
    linter: Linter.EsLint,
    component: false,
    skipFormat: true,
    useProjectJson: true,
  }));

  const { sourceRoot, importPath } = normalizedOptions;

  updateTsConfig(tree, importPath, sourceRoot);
  removeLibFiles(tree, sourceRoot);

  const dependencies: Record<string, string> = {
    axios: AXIOS_VERSION,
    zod: ZOD_VERSION,
    "@next-feature/client": NEXT_FEATURE_CLIENT_VERSION
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

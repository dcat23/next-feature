import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, runTasksInSerial, Tree } from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { libraryGenerator } from '@nx/next';
import * as path from 'path';
import { SONNER_VERSION, ZOD_VERSION } from '../../../lib/constants/versions';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';
import { initializeProjectGenerator, updateDependencies } from '../../../lib/utils';
import { FeatureGeneratorSchema } from './schema';
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
    linter: Linter.EsLint,
    component: false,
    skipFormat: true,
    useProjectJson: true,
  }))

  tasks.push(await initializeProjectGenerator(tree, normalizedOptions, "feature"))

  const { sourceRoot, importPath, name } = normalizedOptions;

  writeWildCardPathToTsConfig(tree, importPath, sourceRoot);

  tree.delete(path.join(sourceRoot, "lib", "hello-server.tsx"));

  const dependencies: Record<string, string> = {
    sonner: SONNER_VERSION,
    zod: ZOD_VERSION
  };

  const devDependencies: Record<string, string> = {};

  tasks.push(updateDependencies(tree, dependencies, devDependencies))

  if (name === 'base') {
    generateFiles(
      tree,
      path.join(__dirname, 'files', 'base'),
      sourceRoot,
      normalizedOptions
    );
  }

  generateFiles(
    tree,
    path.join(__dirname, 'files', 'src'),
    sourceRoot,
    normalizedOptions
  );

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}


export default featureGenerator;

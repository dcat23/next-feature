import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, runTasksInSerial, Tree } from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { libraryGenerator } from '@nx/next';
import * as path from 'path';
import axiosGenerator from '../../generators/axios/axios';
import { SONNER_VERSION, ZOD_VERSION } from '../../lib/constants/versions';
import { updateTsConfig } from '../../lib/ts-config';
import { updateDependencies } from '../../lib/utils';
import authGenerator from '../auth/auth';
import { asApiKeyName } from '../axios/utils';
import {
  FeatureGeneratorSchema,
  type NormalizedFeatureGeneratorSchema,
} from './schema';
import { getDirectory, removeLibFiles } from './utils';

function normalize(
  options: FeatureGeneratorSchema
): NormalizedFeatureGeneratorSchema {
  const directory = getDirectory(options);
  const projectRoot = directory;
  const sourceRoot = path.join(projectRoot, 'src');
  const importPath = `@feature/${options.name}`;

  const apiKeyName = asApiKeyName(options.name)
  return {
    tmpl: '',
    ...options,
    directory,
    projectRoot,
    sourceRoot,
    importPath,
    apiKeyName
  };
}

export async function featureGenerator(
  tree: Tree,
  options: FeatureGeneratorSchema
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
    useProjectJson: true
  }));

  const { sourceRoot, importPath, name } = normalizedOptions;

  updateTsConfig(tree, importPath, sourceRoot);
  removeLibFiles(tree, sourceRoot);

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

  if (normalizedOptions.useAxios) {
    tasks.push(await axiosGenerator(tree, {
      name: normalizedOptions.name,
      projectName: name,
      directory: normalizedOptions.directory,
      skipFormat: true
    }))
  }

  if (normalizedOptions.useAuth) {
    tasks.push(
      await authGenerator(tree, {
        projectName: normalizedOptions.name,
        directory: normalizedOptions.directory,
        skipFormat: true,
      })
    );
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}


export default featureGenerator;

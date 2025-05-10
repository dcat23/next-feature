import { runTasksInSerial } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import {
  formatFiles,
  generateFiles,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { libraryGenerator } from '@nx/js';
import * as path from 'path';
import axiosGenerator from '../../generators/axios/axios';
import { ZOD_VERSION } from '../../lib/constants';
import { writeToDotenv } from '../../lib/dot-env';
import { updateDependencies } from '../../lib/utils';
import authGenerator from '../auth/auth';
import databaseGenerator from '../database/database';
import {
  FeatureGeneratorSchema,
  type NormalizedFeatureGeneratorSchema,
} from './schema';

function normalize(
  options: FeatureGeneratorSchema
): NormalizedFeatureGeneratorSchema {
  options.directory ??= options.name;
  options.srcPath ??= 'src';

  const projectRoot = `${options.directory}`;
  const sourceRoot = path.join(projectRoot, options.srcPath);

  return {
    tmpl: '',
    ...options,
    projectRoot,
    sourceRoot,
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
    buildable: true,
    bundler: 'tsc',
    unitTestRunner: 'jest',
    linter: Linter.EsLint,
    skipFormat: true,
  }));

  updateTsConfig(tree, normalizedOptions);

  const sourceRoot = normalizedOptions.sourceRoot;

  generateFiles(
    tree,
    path.join(__dirname, 'files/src'),
    sourceRoot,
    normalizedOptions
  );

  const dependencies: Record<string, string> = {
    zod: ZOD_VERSION
  };
  const devDependencies: Record<string, string> = {};

  tasks.push(updateDependencies(tree, dependencies, devDependencies))

  writeToDotenv(tree, normalizedOptions, {
    '# FEATURES': '',
    'BACKEND_API_URL': "http://localhost:3000",
  })

  if (normalizedOptions.useAxios || normalizedOptions.useAll) {
    tasks.push(await axiosGenerator(tree, {
      projectName: normalizedOptions.name,
      directory: normalizedOptions.directory,
      skipFormat: true
    }))
  }

  if (normalizedOptions.useAuth || normalizedOptions.useAll) {
    tasks.push(await authGenerator(tree, {
      projectName: normalizedOptions.name,
      directory: normalizedOptions.directory,
      skipFormat: true
    }))
  }

  if (normalizedOptions.useDb || normalizedOptions.useAll) {
    tasks.push(await databaseGenerator(tree, {
      projectName: normalizedOptions.name,
      directory: normalizedOptions.directory,
      skipFormat: true
    }))
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

function updateTsConfig(tree: Tree, options: NormalizedFeatureGeneratorSchema) {
  const tsConfigPath = path.join(options.projectRoot, "tsconfig.lib.json")

  const tsConfig = tree.exists(tsConfigPath)
    ? readJson(tree, tsConfigPath)
    : {}

  tsConfig["compilerOptions"] ??= {};
  tsConfig["compilerOptions"]["baseUrl"] ??= '.';
  tsConfig["compilerOptions"]["paths"] ??= {};
  tsConfig["compilerOptions"]["paths"]["@/*"] ??= [];

  const srcPath = path.join(options.srcPath, "*");

  const paths = tsConfig["compilerOptions"]["paths"]["@/*"] as string[]
  if (!paths.includes(srcPath)) {
    paths.push(srcPath);
    tsConfig["compilerOptions"]["paths"]["@/*"] = paths;
  }

  writeJson(tree, tsConfigPath, tsConfig);
}


export default featureGenerator;

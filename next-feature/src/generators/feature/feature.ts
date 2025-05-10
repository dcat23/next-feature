import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
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
  options.directory ??= '.';
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

  addProjectConfiguration(tree, options.name, {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
    sourceRoot: normalizedOptions.sourceRoot,
    targets: {},
  });

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

  updateDependencies(tree, dependencies, devDependencies);

  writeToDotenv(tree, normalizedOptions, {
    '# FEATURES': '',
    'BACKEND_API_URL': "http://localhost:3000",
  })

  if (normalizedOptions.useAxios || normalizedOptions.useAll) {
    await axiosGenerator(tree, {
      projectName: normalizedOptions.name,
      skipFormat: true
    })
  }

  if (normalizedOptions.useAuth || normalizedOptions.useAll) {
    await authGenerator(tree, {
      projectName: normalizedOptions.name,
      skipFormat: true
    })
  }

  if (normalizedOptions.useDb || normalizedOptions.useAll) {
    await databaseGenerator(tree, {
      skipFormat: true,
      projectName: normalizedOptions.name
    })
  }

  await formatFiles(tree);
}

function updateTsConfig(tree: Tree, options: NormalizedFeatureGeneratorSchema) {
  const tsConfigPath = path.join(options.projectRoot, "tsconfig.json")

  const tsConfig = tree.exists(tsConfigPath)
    ? readJson(tree, tsConfigPath)
    : {}

  tsConfig["compilerOptions"] ??= {};
  tsConfig["compilerOptions"]["baseUrl"] ??= '.';
  tsConfig["compilerOptions"]["paths"] ??= {};
  tsConfig["compilerOptions"]["paths"]["@/*"] ??= [];

  const srcPath = path.join(options.projectRoot, options.srcPath, "*");

  const paths = tsConfig["compilerOptions"]["paths"]["@/*"] as string[]
  if (!paths.includes(srcPath)) {
    paths.push(srcPath);
    tsConfig["compilerOptions"]["paths"]["@/*"] = paths;
  }

  writeJson(tree, tsConfigPath, tsConfig);
}


export default featureGenerator;

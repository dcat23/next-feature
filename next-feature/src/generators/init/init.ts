import {
  addDependenciesToPackageJson,
  formatFiles,
  type GeneratorCallback, readJson,
  readNxJson,
  removeDependenciesFromPackageJson, runTasksInSerial,
  Tree,
  updateNxJson, writeJson
} from '@nx/devkit';
import * as path from 'node:path';
import {
  AXIOS_VERSION,
  PROJECT_NAME,
  PROJECT_VERSION,
  SONNER_VERSION,
  TANSTACK_VERSION,
  ZOD_VERSION,
  ZUSTAND_VERSION,
} from '../../lib/constants';
import type { InitGeneratorSchema, NormalizedInitGeneratorSchema } from './schema';

function updateDependencies(tree: Tree) {
  const tasks: GeneratorCallback[] = [];
  tasks.push(removeDependenciesFromPackageJson(tree, [PROJECT_NAME], []));
  tasks.push(
    addDependenciesToPackageJson(
      tree,
      {
        '@tanstack/react-query': TANSTACK_VERSION,
        sonner: SONNER_VERSION,
        zod: ZOD_VERSION,
        zustand: ZUSTAND_VERSION,
      },
      {
        [PROJECT_NAME]: PROJECT_VERSION,
      },
      undefined,
      true
    )
  );

  return tasks;
}

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {

  options.srcPath ??= "src"
  return initGeneratorInternal(tree, {
    ...options,
  })
}

function normalize(options: InitGeneratorSchema): NormalizedInitGeneratorSchema {

  const projectRoot = `.`;

  return {
    ...options,
    projectRoot
  }
}

export async function initGeneratorInternal(tree: Tree, options: InitGeneratorSchema) {
  const nxJson = readNxJson(tree) || {};
  const hasPlugin = nxJson.plugins?.some((p) =>
    typeof p === 'string' ? p === PROJECT_NAME : p.plugin === PROJECT_NAME
  );
  if (!hasPlugin) {

    nxJson.plugins ??= [];
    nxJson.generators ??= {};
    nxJson.generators[PROJECT_NAME] ??= {};
  }

  const normalizedOptions = normalize(options);

  updateNxJson(tree, nxJson);
  updateTsConfig(tree, normalizedOptions);

  const tasks: GeneratorCallback[] = updateDependencies(tree);

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

function updateTsConfig(tree: Tree, options: NormalizedInitGeneratorSchema) {
  const tsConfigPath = path.join(options.projectRoot, "tsconfig.json")

  const tsConfig = tree.exists(tsConfigPath)
    ? readJson(tree, tsConfigPath)
    : {}

  tsConfig["compilerOptions"] ??= {};
  tsConfig["compilerOptions"]["baseUrl"] ??= options.projectRoot;
  tsConfig["compilerOptions"]["paths"] ??= {};
  tsConfig["compilerOptions"]["paths"]["@/*"] ??= [];

  const srcPath = `${options.projectRoot}/src/*`;
  const paths = tsConfig["compilerOptions"]["paths"]["@/*"] as string[]
  if (!paths.includes(srcPath)) {
    paths.push(srcPath);
    tsConfig["compilerOptions"]["paths"]["@/*"] = paths;
  }

  writeJson(tree, tsConfigPath, tsConfig);
}

export default initGenerator;

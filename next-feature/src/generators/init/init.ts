import {
  addDependenciesToPackageJson, addProjectConfiguration,
  formatFiles,
  type GeneratorCallback, readJson,
  readNxJson,
  removeDependenciesFromPackageJson, runTasksInSerial,
  Tree,
  updateNxJson, writeJson
} from '@nx/devkit';
import * as path from 'node:path';
import {
  PROJECT_NAME,
  PROJECT_VERSION,
  SONNER_VERSION,
  TANSTACK_VERSION,
  ZOD_VERSION,
  ZUSTAND_VERSION,
} from '../../lib/constants';
import type { InitGeneratorSchema } from './schema';


export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  const nxJson = readNxJson(tree) || {};
  // const hasPlugin = nxJson.plugins?.some((p) =>
  //   typeof p === 'string' ? p === PROJECT_NAME : p.plugin === PROJECT_NAME
  // );
  // if (!hasPlugin) {
  // }

  nxJson.plugins ??= [];
  nxJson.generators ??= {};

  updateNxJson(tree, nxJson);

  const tasks: GeneratorCallback[] = updateDependencies(tree);

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

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

export default initGenerator;

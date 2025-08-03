import {
  addDependenciesToPackageJson,
  formatFiles,
  type GeneratorCallback,
  readNxJson,
  removeDependenciesFromPackageJson,
  runTasksInSerial,
  Tree,
  updateNxJson,
} from '@nx/devkit';
import {
  PLUGIN_NAME,
  PLUGIN_VERSION,
  ZOD_VERSION,
} from '../../lib/constants/versions';
import type { InitGeneratorSchema } from './schema';

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  const nxJson = readNxJson(tree) || {};
  const hasPlugin = nxJson.plugins?.some((p) =>
    typeof p === 'string' ? p === PLUGIN_NAME : p.plugin === PLUGIN_NAME
  );

  if (!hasPlugin) {
    nxJson.plugins ??= [];
    nxJson.generators ??= {};
    updateNxJson(tree, nxJson);
  }

  const tasks: GeneratorCallback[] = updateDependencies(tree);

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

function updateDependencies(tree: Tree) {
  const tasks: GeneratorCallback[] = [];
  tasks.push(removeDependenciesFromPackageJson(tree, [PLUGIN_NAME], []));
  tasks.push(
    addDependenciesToPackageJson(
      tree,
      {
        zod: ZOD_VERSION,
      },
      {
        [PLUGIN_NAME]: PLUGIN_VERSION,
      },
      undefined,
      true
    )
  );

  return tasks;
}

export default initGenerator;

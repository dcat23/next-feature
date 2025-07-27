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
import { ZOD_VERSION } from '../../lib/constants';
import { SONNER_VERSION } from '../../lib/constants';
import { ZUSTAND_VERSION } from '../../lib/constants';
import { TANSTACK_VERSION } from '../../lib/constants';
import { PROJECT_NAME, PROJECT_VERSION } from '../../lib/constants';
import type { InitGeneratorSchema } from './schema';

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  const nxJson = readNxJson(tree) || {};
  const hasPlugin = nxJson.plugins?.some((p) =>
    typeof p === 'string' ? p === PROJECT_NAME : p.plugin === PROJECT_NAME
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
  tasks.push(removeDependenciesFromPackageJson(tree, [PROJECT_NAME], []));
  tasks.push(
    addDependenciesToPackageJson(
      tree,
      {
        zod: ZOD_VERSION,
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

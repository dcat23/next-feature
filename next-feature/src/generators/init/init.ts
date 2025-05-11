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
import { PROJECT_NAME, PROJECT_VERSION } from '../../lib/constants';
import featureGenerator from '../feature/feature';
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
        // '@tanstack/react-query': TANSTACK_VERSION, //implement this once its needed
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

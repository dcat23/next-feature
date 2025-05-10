import { updateNxJson } from '@nx/devkit';
import { readNxJson } from '@nx/devkit';
import {
  type ProjectConfiguration,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import type { GeneratorSchema } from './types';
import featureGenerator from '../generators/feature/feature';

export async function initializeGenerator(tree: Tree, options: GeneratorSchema, generatorName: string) {
  let projectConfiguration: ProjectConfiguration;
  try {
    projectConfiguration = readProjectConfiguration(tree, options.projectName);
  } catch (e) {
    await featureGenerator(tree, {
      name: options.projectName,
      directory: options.directory
    });
    projectConfiguration = readProjectConfiguration(tree, options.projectName);

    const nxJson = readNxJson(tree)

    nxJson.generators ??= {};
    nxJson.generators[generatorName] ??= {};

    updateNxJson(tree, nxJson);
  }

  return projectConfiguration;
}

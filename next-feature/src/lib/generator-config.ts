import { updateNxJson } from '@nx/devkit';
import { readNxJson } from '@nx/devkit';
import {
  type ProjectConfiguration,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import featureGenerator from '../generators/project/feature/feature';
import type { GeneratorSchema } from './types';

const PLUGIN_NAME = require('../../package.json').name;

export async function initializeGenerator(tree: Tree, options: GeneratorSchema, generatorName: string) {
  const projectName = options.projectName ?? "base";

  let projectConfiguration: ProjectConfiguration;
  try {
    projectConfiguration = readProjectConfiguration(tree, projectName);
  } catch {
    await featureGenerator(tree, {
      name: projectName,
      directory: options.directory
    });

    projectConfiguration = readProjectConfiguration(tree, projectName);

  }

  const nxJson = readNxJson(tree)

  nxJson.generators ??= {};
  nxJson.generators[PLUGIN_NAME] ??= {};
  nxJson.generators[PLUGIN_NAME][generatorName] ??= {};
  // nxJson.generators[PLUGIN_NAME][generatorName]['projectName'] ??= null;

  updateNxJson(tree, nxJson);

  const projectRoot = projectConfiguration.root;
  const sourceRoot = path.join(projectRoot, "src")
  const directory = path.join(sourceRoot, options.package ?? "")

  return {
    projectRoot,
    sourceRoot,
    directory,
    projectName
  };
}

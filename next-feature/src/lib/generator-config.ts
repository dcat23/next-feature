import { type ProjectConfiguration, readProjectConfiguration, Tree } from '@nx/devkit';
import initGenerator from '../generators/init/init';

export async function initializeGenerator<GeneratorSchema extends { project: string }>(
  tree: Tree,
  options: GeneratorSchema,
  generatorName: string
) {
  let projectConfiguration: ProjectConfiguration;
  try {
    projectConfiguration = readProjectConfiguration(tree, options.project);
  } catch (e) {
    await initGenerator(tree, {});
    projectConfiguration = readProjectConfiguration(tree, options.project);
  }

  projectConfiguration.generators ??= {};
  projectConfiguration.generators[generatorName] ??= {};

  return projectConfiguration;
}

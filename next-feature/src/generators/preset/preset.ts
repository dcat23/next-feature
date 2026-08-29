import { formatFiles, generateFiles, GeneratorCallback, names, runTasksInSerial, Tree } from '@nx/devkit';
import * as path from 'path';
import { addToGitignore, updateDependencies } from '../../lib/utils';
import type { NormalizedPresetGeneratorSchema } from './schema';
import { PresetGeneratorSchema } from './schema';
import { dotEnvContent } from './utils';

function normalize(
  options: PresetGeneratorSchema
): NormalizedPresetGeneratorSchema {
  const projectRoot = '.';

  const title = names(options.name).constantName
    .replace(/_/g, " ")

  return {
    tmpl: '',
    ...options,
    projectRoot,
    title
  };
}

export async function presetGenerator(
  tree: Tree,
  options: PresetGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  const { projectRoot } = normalizedOptions;

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectRoot,
    normalizedOptions
  );

  addToGitignore(
    tree,
    projectRoot,
    dotEnvContent,
  )
  
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default presetGenerator;

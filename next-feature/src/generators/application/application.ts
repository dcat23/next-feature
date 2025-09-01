import {
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import * as path from 'path';
import {
  ApplicationGeneratorSchema,
  NormalizedApplicationGeneratorSchema,
} from './schema';
import { Linter } from '@nx/eslint';
import {
  SONNER_VERSION,
  TANSTACK_VERSION,
  ZOD_VERSION,
} from '../../lib/constants/versions';
import { updateDependencies } from '../../lib/utils';

function normalize(
  options: ApplicationGeneratorSchema
): NormalizedApplicationGeneratorSchema {
  const directory = path.join(options.directory ?? 'apps', options.name);

  const projectRoot = directory;
  const sourceRoot = path.join(projectRoot, 'src');
  const importPath = `@app/${options.name}`;

  return {
    tmpl: '',
    ...options,
    directory,
    projectRoot,
    sourceRoot,
    importPath,
  };
}

export async function applicationGenerator(
  tree: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  tasks.push(
    await nextApplicationGenerator(tree, {
      directory: normalizedOptions.directory,
      name: normalizedOptions.name,
      style: 'tailwind',
      e2eTestRunner: 'none',
      unitTestRunner: 'jest',
      src: true,
      appDir: true,
      linter: Linter.EsLint,
      skipFormat: true,
      useProjectJson: true
    })
  );

  const { projectRoot } = normalizedOptions;

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectRoot,
    normalizedOptions
  );

  const dependencies: Record<string, string> = {
    '@tanstack/react-query': TANSTACK_VERSION,
    sonner: SONNER_VERSION,
    zod: ZOD_VERSION,
  };
  const devDependencies: Record<string, string> = {};

  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;

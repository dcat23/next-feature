import { runTasksInSerial } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { applicationGenerator } from '@nx/next';
import * as path from 'path';
import { ZUSTAND_VERSION } from '../../lib/constants';
import { SONNER_VERSION } from '../../lib/constants';
import { TANSTACK_VERSION } from '../../lib/constants';
import { ZOD_VERSION } from '../../lib/constants';
import { updateTsConfig } from '../../lib/ts-config';
import { updateDependencies } from '../../lib/utils';
import databaseGenerator from '../database/database';
import featureGenerator from '../feature/feature';
import type { NormalizedPresetGeneratorSchema } from './schema';
import { PresetGeneratorSchema } from './schema';

function normalize(
  options: PresetGeneratorSchema
): NormalizedPresetGeneratorSchema {
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

export async function presetGenerator(
  tree: Tree,
  options: PresetGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  tasks.push(
    await applicationGenerator(tree, {
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

  const { projectRoot, sourceRoot, importPath } = normalizedOptions;

  updateTsConfig(tree, importPath, sourceRoot);

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectRoot,
    normalizedOptions
  );

  const dependencies: Record<string, string> = {
    '@tanstack/react-query': TANSTACK_VERSION,
    zustand: ZUSTAND_VERSION,
    sonner: SONNER_VERSION,
    zod: ZOD_VERSION,
  };
  const devDependencies: Record<string, string> = {};

  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  if (normalizedOptions.useDb || normalizedOptions.useAll) {
    tasks.push(
      await databaseGenerator(tree, {
        projectName: normalizedOptions.name,
        directory: normalizedOptions.directory,
        skipFormat: true,
      })
    );
  }

  if (!normalizedOptions.skipFeature) {
    tasks.push(
      await featureGenerator(tree, {
        name: 'base',
        useAxios: true,
        useAuth: true,
        skipFormat: true
      })
    )
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);


  return runTasksInSerial(...tasks);
}

export default presetGenerator;

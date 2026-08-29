import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { TANSTACK_VERSION } from '../../../lib/constants/versions';
import { exportFile } from '../../../lib/export-file';
import { updateDependencies } from '../../../lib/utils';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { normalize } from './lib/utils';
import type { HookGeneratorSchema } from './schema';

export async function hookGenerator(tree: Tree, options: HookGeneratorSchema) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  const { directory, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'hook'
  );

  const outputFile = path.join(directory, normalizedOptions.outputFileName);
  if (!tree.exists(outputFile)) {
    generateFiles(
      tree,
      path.join(__dirname, 'files/src'),
      directory,
      normalizedOptions
    );
  }

  if (normalizedOptions.export) {
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath);
  }

  tasks.push(
    updateDependencies(
      tree,
      { '@tanstack/react-query': TANSTACK_VERSION },
      {}
    )
  );

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default hookGenerator;
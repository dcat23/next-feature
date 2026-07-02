import {
  formatFiles,
  GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { exportFile } from '../../../lib/export-file';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { writeFile } from '../../../lib/write-file';
import { DECLARATION_KINDS } from './lib/types';
import { normalize } from './lib/utils';
import { DeclarationGeneratorSchema } from './schema';

export async function declarationGenerator(
  tree: Tree,
  options: DeclarationGeneratorSchema
) {
  const tasks: GeneratorCallback[] = [];

  const normalizedOptions = normalize(options);
  const { directory, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'declaration'
  );

  const { subDirectory, content } = DECLARATION_KINDS[normalizedOptions.kind];

  await writeFile(
    tree,
    path.join(directory, subDirectory),
    content,
    normalizedOptions,
    normalizedOptions.outputFileName
  );

  if (normalizedOptions.export) {
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath, 'server');
  }

  if (!options.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default declarationGenerator;
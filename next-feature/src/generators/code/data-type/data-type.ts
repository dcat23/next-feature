import {
  formatFiles,
  GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { DataTypeGeneratorSchema } from './schema';
import { dataTypeContent, normalize } from './lib/utils';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { exportFile } from '../../../lib/export-file';
import { writeFile } from '../../../lib/write-file';
import * as path from 'path';

export async function dataTypeGenerator(
  tree: Tree,
  options: DataTypeGeneratorSchema
) {
  const tasks: GeneratorCallback[] = [];

  const normalizedOptions = normalize(options);
  const { directory, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'data-type'
  );
  await writeFile(
    tree,
    path.join(directory, 'types'),
    dataTypeContent,
    normalizedOptions,
    normalizedOptions.outputFileName
  );

  if (normalizedOptions.export) {
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath);
  }

  if (!options.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default dataTypeGenerator;

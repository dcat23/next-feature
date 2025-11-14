import { formatFiles, GeneratorCallback, runTasksInSerial, Tree } from '@nx/devkit';
import { writeFile } from '../../../lib/write-file';
import { exportFile } from '../../../lib/export-file';
import { ConstantGeneratorSchema } from './schema';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import * as path from 'path';
import { constantContent, normalize } from './lib/utils';

export async function constantGenerator(
  tree: Tree,
  options: ConstantGeneratorSchema
) {
  const tasks: GeneratorCallback[] = [];
  const normalizedOptions = normalize(options);
  const { directory, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'constant'
  );

  await writeFile(
    tree,
    path.join(directory, 'constants'),
    constantContent,
    normalizedOptions,
    normalizedOptions.outputFileName
  )

  if (normalizedOptions.export) {
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath);
  }

  if (!options.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks)
}

export default constantGenerator;

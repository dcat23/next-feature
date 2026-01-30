import {
  formatFiles,
  GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { UtilityGeneratorSchema } from './schema';
import { normalize, utilsContent } from './lib/utils';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { exportFile } from '../../../lib/export-file';
import { writeFile } from '../../../lib/write-file';

export async function utilityGenerator(
  tree: Tree,
  options: UtilityGeneratorSchema
) {
  const tasks: GeneratorCallback[] = [];

  const normalizedOptions = normalize(options);
  const { directory, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'utility'
  );

  await writeFile(
    tree,
    path.join(directory, 'utils'),
    utilsContent,
    normalizedOptions,
    normalizedOptions.outputFileName
  )

  if (normalizedOptions.export) {
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath, "server");
  }

  if (!options.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks)
}

export default utilityGenerator;

import { formatFiles, Tree } from '@nx/devkit';
import { writeFile } from '../../../lib/write-file';
import { ConstantGeneratorSchema } from './schema';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import * as path from 'path';
import { constantContent, normalize } from './lib/utils';

export async function constantGenerator(
  tree: Tree,
  options: ConstantGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const { directory } = await initializeCodeGenerator(
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
  );

  if (!options.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
}

export default constantGenerator;

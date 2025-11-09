import { formatFiles, Tree } from '@nx/devkit';
import { DataTypeGeneratorSchema } from './schema';
import { dataTypeContent, normalize } from './lib/utils';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { writeFile } from '../../../lib/write-file';
import * as path from 'path';

export async function dataTypeGenerator(
  tree: Tree,
  options: DataTypeGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const { directory } = await initializeCodeGenerator(
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

  if (!options.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
}

export default dataTypeGenerator;

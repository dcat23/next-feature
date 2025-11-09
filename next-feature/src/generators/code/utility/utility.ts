import { formatFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { UtilityGeneratorSchema } from './schema';
import { normalize, utilsContent } from './lib/utils';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { writeFile } from '../../../lib/write-file';

export async function utilityGenerator(
  tree: Tree,
  options: UtilityGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const { directory } = await initializeCodeGenerator(
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
  );

  if (!options.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

export default utilityGenerator;

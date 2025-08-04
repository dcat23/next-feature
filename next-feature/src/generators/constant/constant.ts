import { formatFiles, names, Tree } from '@nx/devkit';
import { initializeGenerator } from '../../lib/generator-config';
import type { GeneratorSchema, Normalized, WithNames } from '../../lib/types';
import { writeFile } from '../../lib/write-file';
import {
  ConstantGeneratorSchema,
  NormalizedConstantGeneratorSchema,
} from './schema';

function normalize(
  options: ConstantGeneratorSchema
): NormalizedConstantGeneratorSchema {
  const mutatedNames = names(options.name);
  options.package ??= 'lib';
  const outputFileName = (
    options.file
      ? typeof options.file === 'string'
        ? options.file
        : mutatedNames.fileName
      : 'index'
  ).concat('.ts');
  return {
    tmpl: '',
    ...options,
    ...mutatedNames,
    outputFileName,
  };
}


const constantContent = (options: Normalized<WithNames<GeneratorSchema>>) => (`
export const ${options.constantName}: ${options.className} = null;
`);

export async function constantGenerator(
  tree: Tree,
  options: ConstantGeneratorSchema
) {
  const normalizedOptions = normalize(options);

  // logger.debug({ normalizedOptions })
  const { directory } = await initializeGenerator(
    tree,
    normalizedOptions,
    'constant'
  );

  await writeFile(
    tree,
    `${directory}/constants`,
    constantContent,
    normalizedOptions,
    normalizedOptions.outputFileName
  );

  if (!options.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
}

export default constantGenerator;

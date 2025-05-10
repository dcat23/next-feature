import { names } from '@nx/devkit';
import { formatFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { initializeGenerator } from '../../lib/generator-config';
import type { WithNames } from '../../lib/types';
import type { GeneratorSchema } from '../../lib/types';
import type { Normalized } from '../../lib/types';
import { writeFile } from '../../lib/write-file';
import type { NormalizedTypesGeneratorSchema } from './schema';
import { TypesGeneratorSchema } from './schema';

function normalize(
  options: TypesGeneratorSchema
): NormalizedTypesGeneratorSchema {
  options.projectName ??= 'features';
  options.package ??= 'lib';

  const mutatedNames = names(options.name);

  return {
    tmpl: '',
    ...options,
    ...mutatedNames,
  };
}



const typesContent = (options: Normalized<WithNames<GeneratorSchema>>) => (`
export interface ${options.className} {
}
`);

export async function typesGenerator(
  tree: Tree,
  options: TypesGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  // logger.debug({ normalizedOptions });
  const { sourceRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'types'
  );

  const directory = path.join(
    sourceRoot,
    normalizedOptions.package,
  );

  await writeFile(
    tree,
    `${directory}/types`,
    typesContent,
    normalizedOptions,
  );

  if (!normalizedOptions.skipFormat) await formatFiles(tree);
}

export default typesGenerator;

import { logger } from '@nx/devkit';
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
  options.directory ??= 'lib';

  const mutatedNames = names(options.name);

  return {
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
    'api'
  );

  const directory = path.join(
    sourceRoot,
    normalizedOptions.directory,
  );

  await writeFile(
    tree,
    `${directory}/types`,
    typesContent,
    normalizedOptions,
  );

  await formatFiles(tree);
}

export default typesGenerator;

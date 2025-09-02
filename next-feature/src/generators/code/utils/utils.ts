import { names } from '@nx/devkit';
import { formatFiles, Tree } from '@nx/devkit';
import { initializeGenerator } from '../../../lib/generator-config';
import type { GeneratorSchema } from '../../../lib/types';
import type { WithNames } from '../../../lib/types';
import type { Normalized } from '../../../lib/types';
import { writeFile } from '../../../lib/write-file';
import type { NormalizedUtilsGeneratorSchema } from './schema';
import { UtilsGeneratorSchema } from './schema';
import * as path from 'path';

function normalize(options: UtilsGeneratorSchema): NormalizedUtilsGeneratorSchema {
  const mutatedNames = names(options.name);
  options.package ??= "lib";
  const outputFileName = (options.file
      ? (typeof options.file === "string" ? options.file : mutatedNames.fileName)
      : "index").concat(".ts");

  return {
    tmpl: "",
    ...options,
   ...mutatedNames,
    outputFileName
  }
}

const utilsContent = (options: Normalized<WithNames<GeneratorSchema>>) => (`
export function ${options.propertyName}(data: any) {

  return data;
}
`);

export async function utilsGenerator(
  tree: Tree,
  options: UtilsGeneratorSchema
) {
  const normalizedOptions = normalize(options);

  const { directory } = await initializeGenerator(
    tree,
    normalizedOptions,
    'utils'
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

export default utilsGenerator;

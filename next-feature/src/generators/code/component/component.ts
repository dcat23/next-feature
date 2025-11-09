import { formatFiles, generateFiles, names, Tree } from '@nx/devkit';
import * as path from 'path';
import type { NormalizedComponentGeneratorSchema } from './schema';
import { ComponentGeneratorSchema } from './schema';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';

function normalize(
  options: ComponentGeneratorSchema
): NormalizedComponentGeneratorSchema {
  options.package ??= 'components';
  options.componentType ??= 'component';
  const mutatedNames = names(options.name);
  const outputFileName = mutatedNames.fileName;
  return {
    tmpl: '',
    ...options,
    names: mutatedNames,
    outputFileName
  };
}

export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema
) {

  const normalizedOptions = normalize(options);
  const { directory } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'component'
  );

  generateFiles(tree, path.join(__dirname, 'files', normalizedOptions.componentType), directory, normalizedOptions);

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

export default componentGenerator;

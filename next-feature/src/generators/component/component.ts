import { names } from '@nx/devkit';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { initializeGenerator } from '../../lib/generator-config';
import type { NormalizedComponentGeneratorSchema } from './schema';
import { ComponentGeneratorSchema } from './schema';

function normalize(
  options: ComponentGeneratorSchema
): NormalizedComponentGeneratorSchema {
  options.package ??= '';

  const mutatedNames = names(options.projectName);

  return {
    tmpl: '',
    ...options,
    ...mutatedNames,
  };
}

export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema
) {

  const normalizedOptions = normalize(options);
  const { directory } = await initializeGenerator(
    tree,
    normalizedOptions,
    'component'
  );




  generateFiles(tree, path.join(__dirname, 'files/src'), directory, normalizedOptions);


  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

export default componentGenerator;

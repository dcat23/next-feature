import { names } from '@nx/devkit';
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { initializeGenerator } from '../../lib/generator-config';
import type { NormalizedComponentGeneratorSchema } from './schema';
import { ComponentGeneratorSchema } from './schema';


function normalize(options: ComponentGeneratorSchema): NormalizedComponentGeneratorSchema {
  options.projectName ??= 'features';
  options.directory ??= options.projectName;
  options.package ??= 'components';

  const mutatedNames = names(options.name);

  return {
    tmpl: '',
    ...options,
    ...mutatedNames,
  }
}

export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema
) {

  const normalizedOptions = normalize(options);
  // logger.debug({ normalizedOptions });
  const { sourceRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'component'
  );

  const directory = path.join(
    sourceRoot,
    normalizedOptions.package,
  );

  generateFiles(tree, path.join(__dirname, 'files/src'), directory, normalizedOptions);


  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

export default componentGenerator;

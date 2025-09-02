import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { NEXTAUTH_VERSION } from '../../lib/constants/versions';
import { initializeGenerator } from '../../lib/generator-config';
import type {
  AuthGeneratorSchema,
  NormalizedAuthGeneratorSchema,
} from './schema';

function normalize(
  options: AuthGeneratorSchema
): NormalizedAuthGeneratorSchema {
  options.package ??= 'lib';
  return {
    tmpl: '',
    ...options,
  };
}

export async function authGenerator(tree: Tree, options: AuthGeneratorSchema) {
  const normalizedOptions = normalize(options);

  const { sourceRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'auth'
  );

  const depTask = updateDependencies(tree);

  generateFiles(tree, path.join(__dirname, 'files/src'), sourceRoot, normalizedOptions);

  if (!options.skipFormat) await formatFiles(tree);

  return depTask
}


function updateDependencies(tree: Tree) {
  const task: GeneratorCallback = (
    addDependenciesToPackageJson(
      tree,
      {
        'next-auth': NEXTAUTH_VERSION,
      },
      {},
      undefined,
      true
    )
  );

  return task;
}

export default authGenerator;




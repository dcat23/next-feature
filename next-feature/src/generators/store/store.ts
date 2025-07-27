import { runTasksInSerial } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { ZUSTAND_VERSION } from '../../lib/constants';
import { ZOD_VERSION } from '../../lib/constants';
import { initializeGenerator } from '../../lib/generator-config';
import { updateDependencies } from '../../lib/utils';
import typesGenerator from '../types/types';
import { mutateNames } from './lib/options';
import { zustandCreateMethod } from './lib/options';
import type { NormalizedStoreGeneratorSchema } from './schema';
import { StoreGeneratorSchema } from './schema';

function normalize(
  options: StoreGeneratorSchema
): NormalizedStoreGeneratorSchema {
  options.package ??= 'lib';
  options.persist = Boolean(options.persist);
  options.useTypes = Boolean(options.useTypes);

  const mutatedNames = mutateNames(options);
  const createMethod = zustandCreateMethod({ ...options, ...mutatedNames });
  return {
    tmpl: '',
    ...options,
    ...mutatedNames,
    createMethod,
  };
}

export async function storeGenerator(
  tree: Tree,
  options: StoreGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  // logger.debug({ normalizedOptions });
  const { directory: sourceDirectory } = await initializeGenerator(
    tree,
    normalizedOptions,
    'store'
  );

  const directory = path.join(sourceDirectory,'store');


  const storeType = normalizedOptions.useContext ? "context" : "zustand";
  generateFiles(tree, path.join(__dirname, "files", "src", storeType), directory, normalizedOptions);


  const dependencies: Record<string, string> = {
    zustand: ZUSTAND_VERSION
  };
  const devDependencies: Record<string, string> = {};

  tasks.push(updateDependencies(tree, dependencies, devDependencies))

  if (normalizedOptions.useTypes) {
    tasks.push(await typesGenerator(tree, { ...normalizedOptions, skipFormat: true }))
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default storeGenerator;

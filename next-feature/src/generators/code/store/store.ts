import { type GeneratorCallback, logger } from '@nx/devkit';
import { formatFiles, generateFiles, runTasksInSerial, Tree } from '@nx/devkit';
import * as path from 'path';
import { ZUSTAND_VERSION } from '../../../lib/constants/versions';
import { initializeGenerator } from '../../../lib/generator-config';
import { updateDependencies } from '../../../lib/utils';
import typesGenerator from '../types/types';
import { mutateNames, zustandCreateMethod } from './lib/options';
import type { NormalizedStoreGeneratorSchema } from './schema';
import { StoreGeneratorSchema } from './schema';

function normalize(
  options: StoreGeneratorSchema
): NormalizedStoreGeneratorSchema {
  options.package ??= 'store';
  options.persist = Boolean(options.persist);
  options.useTypes = Boolean(options.useTypes);

  const mutatedNames = mutateNames(options);
  const createMethod = zustandCreateMethod({ ...options, ...mutatedNames });
  const storeType = options.useContext ? "context" : "zustand";

  return {
    tmpl: '',
    ...options,
    ...mutatedNames,
    createMethod,
    storeType,
  };
}

export async function storeGenerator(
  tree: Tree,
  options: StoreGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  const { directory } = await initializeGenerator(
    tree,
    normalizedOptions,
    'store'
  );

  // const directory = path.join(sourceDirectory,'store');
  generateFiles(tree, path.join(__dirname, "files/src", normalizedOptions.storeType), directory, normalizedOptions);

  logger.info({
    fn: 'storeGenerator',
    directory,
    normalizedOptions
  })


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

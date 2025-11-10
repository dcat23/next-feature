import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { ZUSTAND_VERSION } from '../../../lib/constants/versions';
import { updateDependencies } from '../../../lib/utils';
import typesGenerator from '../data-type/data-type';
import { mutateNames, zustandCreateMethod } from './lib/options';
import type { NormalizedStoreGeneratorSchema } from './schema';
import { StoreGeneratorSchema } from './schema';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';

function normalize(
  options: StoreGeneratorSchema
): NormalizedStoreGeneratorSchema {
  options.package ??= 'store';
  options.persist = Boolean(options.persist);
  options.useTypes = Boolean(options.useTypes);

  const mutatedNames = mutateNames(options);
  const createMethod = zustandCreateMethod({ ...options, ...mutatedNames });
  const storeType = options.useContext ? 'context' : 'zustand';
  return {
    tmpl: '',
    ...options,
    outputFileName: mutatedNames.fileName,
    names: mutatedNames,
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

  const { directory } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'store'
  );

  generateFiles(tree, path.join(__dirname, "files/src", normalizedOptions.storeType), directory, normalizedOptions);

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

import { logger, runTasksInSerial } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { names } from '@nx/devkit';
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { initializeGenerator } from '../../lib/generator-config';
import typesGenerator from '../types/types';
import { mutateNames } from './lib/options';
import { zustandCreateMethod } from './lib/options';
import type { NormalizedStoreGeneratorSchema } from './schema';
import { StoreGeneratorSchema } from './schema';


function normalize(options: StoreGeneratorSchema): NormalizedStoreGeneratorSchema {
  options.projectName ??= 'features';
  options.directory ??= options.projectName;
  options.package ??= 'lib';
  options.persist = Boolean(options.persist);
  options.useTypes = Boolean(options.useTypes);

  const mutatedNames = mutateNames(options.name);
  const createMethod = zustandCreateMethod({ ...options, ...mutatedNames });
  return {
    tmpl: "",
    ...options,
    ...mutatedNames,
    createMethod,
  }
}

export async function storeGenerator(
  tree: Tree,
  options: StoreGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  // logger.debug({ normalizedOptions });
  const { root: projectRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'store'
  );

  const directory = path.join(
    projectRoot,
    'src',
    normalizedOptions.package,
    'store'
  );

  const storeType = normalizedOptions.useContext ? "context" : "zustand";

  generateFiles(tree, path.join(__dirname, `files/src/${storeType}`), directory, normalizedOptions);

  if (normalizedOptions.useTypes) {
    tasks.push(await typesGenerator(tree, { ...normalizedOptions, skipFormat: true }))
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default storeGenerator;

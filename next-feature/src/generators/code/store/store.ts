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
import { exportFile } from '../../../lib/export-file';
import typesGenerator from '../data-type/data-type';
import { mutateNames, zustandCreateMethod } from './lib/options';
import type { NormalizedStoreGeneratorSchema } from './schema';
import { StoreGeneratorSchema } from './schema';
import { handleExportPath, initializeCodeGenerator, normalizeCodeGenerator } from '../../../lib/utils/code-generator';

function normalize(
  options: StoreGeneratorSchema
): NormalizedStoreGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  normalized.package ??= 'store';
  normalized.persist = Boolean(normalized.persist);
  normalized.useTypes = Boolean(normalized.useTypes);
  const mutatedNames = mutateNames(normalized);
  const createMethod = zustandCreateMethod({ ...normalized, ...mutatedNames });
  const storeType = normalized.useContext ? 'context' : 'zustand';
  const exportPath = handleExportPath(normalized, storeType)
  return {
   ...normalized,
    names: mutatedNames,
    createMethod,
    storeType,
    exportPath
  };
}

export async function storeGenerator(
  tree: Tree,
  options: StoreGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  const { directory, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'store'
  );

  generateFiles(tree, path.join(__dirname, "files/src", normalizedOptions.storeType), directory, normalizedOptions);

  if (normalizedOptions.export) {
    const exportPath = path.join(
      normalizedOptions.package ?? 'store',
      normalizedOptions.outputFileName.replace(/\.tsx$/, '')
    ).split(path.sep).join('/');

    await exportFile(tree, sourceRoot, exportPath);
  }

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

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
import { StoreGeneratorSchema } from './schema';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { normalizeStoreGenerator } from './lib/utils';


export async function storeGenerator(
  tree: Tree,
  options: StoreGeneratorSchema
) {
  const normalizedOptions = normalizeStoreGenerator(options);
  const tasks: GeneratorCallback[] = [];

  const { directory, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'store'
  );

  generateFiles(tree, path.join(__dirname, "files/src", normalizedOptions.storeType), directory, normalizedOptions);

  if (normalizedOptions.export) {
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath);
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

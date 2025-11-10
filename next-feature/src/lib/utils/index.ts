import { addDependenciesToPackageJson, readNxJson } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import * as path from 'node:path';
import {
  NormalizedProjectGeneratorSchema,
  ProjectGeneratorSchema,
} from '../types';
import { PLUGIN_NAME } from '../constants/versions';
import { updateTsConfig } from '../ts-config';
import { libraryGenerator } from '@nx/next';
import { Linter } from '@nx/eslint';

export function updateDependencies(
  tree: Tree,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
  projectRoot?: string
): GeneratorCallback {
  const task: GeneratorCallback = addDependenciesToPackageJson(
    tree,
    dependencies,
    devDependencies,
    projectRoot,
    true
  );

  return task;
}

/**
 * [add-to-gitignore]
 * next-feature@0.0.10
 * September 1st 2025, 6:41:00 pm
 */
export function addToGitignore(
  tree: Tree,
  directory: string,
  content: () => string
) {
  const filePath = path.join(directory, '.gitignore');
  let buffer = tree.read(filePath, 'utf-8') ?? '';
  buffer += content();
  tree.write(filePath, buffer);
}

/**
 * [project-generator]
 * next-feature@0.0.12
 * November 9th 2025, 3:04:31 am
 */
export async function initializeProjectGenerator(
  tree: Tree,
  options: NormalizedProjectGeneratorSchema,
  generatorName: string
) {

  await libraryGenerator(tree, {
    directory: options.directory,
    name: options.name,
    importPath: options.importPath,
    bundler: 'vite',
    style: 'tailwind',
    unitTestRunner: 'jest',
    linter: Linter.EsLint,
    component: false,
    skipFormat: true,
    useProjectJson: true,
  });

  const nxJson = readNxJson(tree);

  nxJson.generators ??= {};
  nxJson.generators[PLUGIN_NAME] ??= {};
  nxJson.generators[PLUGIN_NAME][generatorName] ??= {};
  nxJson.generators[PLUGIN_NAME][generatorName]["orgName"] ??= options.orgName;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

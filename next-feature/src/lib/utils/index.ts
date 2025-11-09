import { addDependenciesToPackageJson } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import * as path from 'node:path';
import { ProjectGeneratorSchema } from '../types';

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
export function projectGenerator(options: ProjectGeneratorSchema) {
  return {};
}

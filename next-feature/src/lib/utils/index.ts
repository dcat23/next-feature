import type { GeneratorCallback } from '@nx/devkit';
import {
  addDependenciesToPackageJson,
  joinPathFragments,
  readNxJson,
  Tree,
  updateNxJson,
} from '@nx/devkit';
import * as path from 'node:path';
import { NormalizedProjectGeneratorSchema } from '../types';
import { PLUGIN_NAME } from '../constants/versions';

export interface UpdateDependenciesOptions {
  /** Project whose package.json to update (default: the workspace root) */
  projectRoot?: string;
  /**
   * Raise a package that's already installed at a lower version, for
   * generated code that needs a minimum version. Never downgrades. By
   * default an installed package keeps whatever version it has.
   */
  updateExistingVersions?: boolean;
}

/**
 * [update-dependencies]
 * Adds dependencies to a package.json and returns the install task. The last
 * argument is the options, or a project root (kept for older callers).
 */
export function updateDependencies(
  tree: Tree,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
  options: UpdateDependenciesOptions | string = {}
): GeneratorCallback {
  const { projectRoot, updateExistingVersions = false } =
    typeof options === 'string' ? { projectRoot: options } : options;

  const packageJsonPath = projectRoot
    ? joinPathFragments(projectRoot, 'package.json')
    : 'package.json';
  if (!tree.exists(packageJsonPath)) {
    throw new Error(`updateDependencies: ${packageJsonPath} does not exist`);
  }

  return addDependenciesToPackageJson(
    tree,
    dependencies,
    devDependencies,
    packageJsonPath,
    !updateExistingVersions
  );
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
  const buffer = tree.read(filePath, 'utf-8') ?? '';
  const existingLines = new Set(
    buffer.split('\n').map((line) => line.trim()).filter(Boolean)
  );

  const newLines = content()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !existingLines.has(line));

  if (newLines.length === 0) return;

  const separator = buffer && !buffer.endsWith('\n') ? '\n' : '';
  tree.write(filePath, `${buffer}${separator}${newLines.join('\n')}\n`);
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
  const nxJson = readNxJson(tree) || {};

  nxJson.generators ??= {};
  nxJson.generators[PLUGIN_NAME] ??= {};
  nxJson.generators[PLUGIN_NAME][generatorName] ??= {};
  nxJson.generators[PLUGIN_NAME][generatorName]["orgName"] ??= options.orgName || generatorName;

  updateNxJson(tree, nxJson);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

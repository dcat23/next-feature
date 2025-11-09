import {
  NormalizedProjectGeneratorSchema,
  ProjectGeneratorSchema,
} from '../types';
import * as path from 'path';
import { NormalizedClientGeneratorSchema } from '../../generators/project/client/schema';
import { Linter } from '@nx/eslint';
import { libraryGenerator } from '@nx/next';
import { Tree } from '@nx/devkit';

/**
 * [normalize-project-generator]
 * next-feature@0.0.12
 * November 9th 2025, 3:17:18 am
 */
export function normalizeProjectGenerator<T extends ProjectGeneratorSchema>(
  options: T,
  projectType: string
): NormalizedProjectGeneratorSchema<T> {
  const directory = getDirectory(options, projectType);
  const projectRoot = directory;
  const sourceRoot = path.join(projectRoot, 'src');
  const importPath = getImportPath(options, projectType);
  return {
    tmpl: '',
    ...options,
    directory,
    projectRoot,
    sourceRoot,
    importPath,
  };
}

/**
 * [get-directory]
 * next-feature@0.0.12
 * November 9th 2025, 3:18:49 am
 */
export function getDirectory(
  options: ProjectGeneratorSchema,
  projectType: string
) {
  if (!options.directory) {
    return path.join(projectType.concat('s'), options.name);
  }

  return path.normalize(options.directory);
}

/**
 * [get-import-path]
 * next-feature@0.0.12
 * November 9th 2025, 3:19:07 am
 */
export function getImportPath(
  options: ProjectGeneratorSchema,
  projectType: string
) {
  return `@${projectType}/${options.name}`;
}


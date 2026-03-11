import { joinPathFragments } from '@nx/devkit';
import * as path from 'path';
import {
  NormalizedProjectGeneratorSchema,
  ProjectGeneratorSchema,
} from '../types';
import { pluralize, singularize } from './string';

/**
 * [normalize-project-generator]
 * next-feature@0.0.12
 * November 9th 2025, 3:17:18 am
 */
export function normalizeProjectGeneratorSchema<T extends ProjectGeneratorSchema>(
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
    return joinPathFragments(pluralize(projectType), options.name);
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
  const scope = options.orgName ?? singularize(projectType);
  return `@${scope}/${options.name}`;
}


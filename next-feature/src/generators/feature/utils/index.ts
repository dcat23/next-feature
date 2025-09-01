import * as path from 'path';
import type { FeatureGeneratorSchema } from '../schema';
import { Tree } from '@nx/devkit';

/**
 * next-feature:get-directory
 * Sat Jul 26 2025
 */
export function getDirectory(options: FeatureGeneratorSchema): string {
  if (!options.directory) {
    return path.join('features', options.name);
  }

  return path.normalize(options.directory);
}

/**
 * [remove-lib-files]
 * September 1st 2025, 3:23:34 pm
 */
export function removeLibFiles(tree: Tree, sourceRoot: string) {
  tree.delete(path.join(sourceRoot, "server.ts"));
  tree.delete(path.join(sourceRoot, "lib", "hello-server.tsx"));
}

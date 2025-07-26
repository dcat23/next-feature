import * as path from 'path';
import type { FeatureGeneratorSchema } from '../schema';

/**
 * next-feature:get-directory
 * Sat Jul 26 2025
 */
export function getDirectory(options: FeatureGeneratorSchema): string {
  if (!options.directory) {
    return path.join('features', options.name)
  }

  const parsedPath = path.parse(options.directory);

  return parsedPath.dir;
}

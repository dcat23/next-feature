import { logger, Tree } from '@nx/devkit';
import * as path from 'path';

/**
 * Adds an export statement to the root src/index.ts file
 * Maintains a sorted, deduplicated set of exports
 *
 * @param tree - The Nx Tree
 * @param sourceRoot - The src directory of the project (e.g., 'packages/myfeature/src')
 * @param exportPath - The relative path to export (e.g., 'lib/actions/my-action', without .ts extension)
 */
export async function exportFile(
  tree: Tree,
  sourceRoot: string,
  exportPath: string
) {
  const rootIndexPath = path.join(sourceRoot, 'index.ts');
  const normalizedPath = './' + exportPath.split(path.sep).join('/');

  let buffer = tree.read(rootIndexPath, 'utf-8') ?? '';

  // Parse existing exports into a set
  const exportSet = new Set<string>();
  const exportRegex = /^export\s+\*\s+from\s+['"]([^'"]+)['"]\s*;?$/gm;
  let match;

  while ((match = exportRegex.exec(buffer)) !== null) {
    exportSet.add(match[1]);
  }

  // Add new export if it doesn't exist
  if (!exportSet.has(normalizedPath)) {
    exportSet.add(normalizedPath);
    logger.info(`Added export: ${normalizedPath}`);
  } else {
    logger.debug(`Export already exists: ${normalizedPath}`);
    return;
  }

  // Sort and rebuild exports
  const sortedExports = Array.from(exportSet).sort();
  const exportLines = sortedExports
    .map((exportPath) => `export * from '${exportPath}';`)
    .join('\n');

  // Remove all old export statements and rebuild
  const bufferWithoutExports = buffer.replace(exportRegex, '').trim();
  const newBuffer = bufferWithoutExports
    ? `${bufferWithoutExports}\n\n${exportLines}\n`
    : `${exportLines}\n`;

  tree.write(rootIndexPath, newBuffer);

  return () => {};
}

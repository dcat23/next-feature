import { logger } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import type { WithNames } from './types';
import type { GeneratorSchema } from './types';
import type { Normalized } from './types';

const commentText = (options: Normalized<WithNames<GeneratorSchema>>) => `
/**
* ${options.projectName}:${options.name}
* ${new Date().toDateString()}
*/`

export async function writeFile<T extends WithNames<GeneratorSchema>>(
  tree: Tree,
  directory: string,
  contentGenerator: (normalizedOptions: Normalized<T>) => string,
  options: Normalized<T>,
  fileName = 'index.ts'
) {
  const filePath = `${directory}/${fileName}`;
  // logger.debug({filePath})
  let buffer = tree.read(filePath, 'utf-8') ?? "";

  if (buffer.includes(`${options.projectName}:${options.name}`)) {
    logger.debug('skipping', options.name);
    return;
  }

  buffer += commentText(options);
  buffer += contentGenerator(options);
  tree.write(filePath, buffer);
}

import { logger } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import type { WithNames } from './types';
import type { GeneratorSchema } from './types';
import type { Normalized } from './types';
import moment = require('moment');


const identifier = (options: Normalized<WithNames<GeneratorSchema>>) => {
  return `[${options.fileName}]`
}

const commentText = (options: Normalized<WithNames<GeneratorSchema>>) => `
/**
* ${identifier(options)}
* ${moment().format('MMMM Do YYYY, h:mm:ss a')}
*/`

export async function writeFile<T extends WithNames<GeneratorSchema>>(
  tree: Tree,
  directory: string,
  contentGenerator: (normalizedOptions: Normalized<T>) => string,
  options: Normalized<T>,
  fileName = 'index.ts'
) {
  const filePath = `${directory}/${fileName}`;
  let buffer = tree.read(filePath, 'utf-8') ?? "";

  if (buffer.includes(identifier(options))) {
    logger.debug('skipping', options.name);
    return;
  }

  buffer += commentText(options);
  buffer += contentGenerator(options);
  tree.write(filePath, buffer);
}

import { logger, Tree } from '@nx/devkit';
import type {
  CodeGeneratorSchema,
  Normalized,
  NormalizedCodeGeneratorSchema,
} from './types';
import { PLUGIN_NAME, PLUGIN_VERSION } from './constants/versions';
import moment = require('moment');
import path = require('path');


const identifier = (options: NormalizedCodeGeneratorSchema<CodeGeneratorSchema>) => {
  return `[${options.names.fileName}]`
}

const commentText = (options: NormalizedCodeGeneratorSchema<CodeGeneratorSchema>) => `
/**
* ${identifier(options)}
* ${PLUGIN_NAME}@${PLUGIN_VERSION}
* ${moment().format('MMMM Do YYYY, h:mm:ss a')}
*/`

export async function writeFile<T extends NormalizedCodeGeneratorSchema<CodeGeneratorSchema>>(
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

  return tree.write(filePath, buffer);
}

export async function writeCodeFile<
  T extends NormalizedCodeGeneratorSchema<CodeGeneratorSchema>
>(
  tree: Tree,
  filePath: string,
  options: T,
  contentGenerator: (normalizedOptions: T) => string,
) {
  let buffer = tree.read(filePath, 'utf-8') ?? "";

  if (buffer.includes(identifier(options))) {
    logger.debug('skipping', options.name);
    return;
  }

  buffer += commentText(options);
  buffer += contentGenerator(options);

  return tree.write(filePath, buffer);
}

import { logger, Tree } from '@nx/devkit';
import type {
  CodeGeneratorSchema,
  Normalized,
  NormalizedCodeGeneratorSchema,
} from './types';
import { PLUGIN_NAME, PLUGIN_VERSION } from './constants/versions';

const ORDINAL_SUFFIXES: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'st', two: 'nd', few: 'rd' };
const ordinals = new Intl.PluralRules('en-US', { type: 'ordinal' });
const months = new Intl.DateTimeFormat('en-US', { month: 'long' });

/** e.g. "January 10th 2026, 9:15:08 pm" (local time) */
export function formatTimestamp(date: Date = new Date()): string {
  const day = date.getDate();
  const suffix = ORDINAL_SUFFIXES[ordinals.select(day)] ?? 'th';
  const hours = date.getHours();
  const pad = (value: number) => String(value).padStart(2, '0');
  const time = `${hours % 12 || 12}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${hours < 12 ? 'am' : 'pm'}`;
  return `${months.format(date)} ${day}${suffix} ${date.getFullYear()}, ${time}`;
}


const identifier = (options: NormalizedCodeGeneratorSchema<CodeGeneratorSchema>) => {
  return `[${options.names.fileName}]`
}

const commentText = (options: NormalizedCodeGeneratorSchema<CodeGeneratorSchema>) => `
/**
* ${identifier(options)}
* ${PLUGIN_NAME}@${PLUGIN_VERSION}
* ${formatTimestamp()}
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

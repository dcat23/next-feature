import { runTasksInSerial } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { names } from '@nx/devkit';
import { generateFiles } from '@nx/devkit';
import { formatFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { initializeGenerator } from '../../lib/generator-config';
import typesGenerator from '../types/types';
import { extractHttpMethod } from './lib/extract-http-method';
import type { NormalizedApiGeneratorSchema } from './schema';
import type { ApiGeneratorSchema } from './schema';

function normalize(options: ApiGeneratorSchema): NormalizedApiGeneratorSchema {
  options.package ??= 'lib';

  const mutatedNames = names(options.name);
  const { propertyName, className, name } = mutatedNames;
  const { method: httpMethod, noPrefix: noPrefixClassName } =
    extractHttpMethod(name);

  const methodName = propertyName;
  const endpoint = names(noPrefixClassName).fileName.replace('-', '/');

  const asTypeImport = (dataType: string) => dataType;

  const typeImports = [className].map(asTypeImport).join(', ');

  return {
    tmpl: '',
    ...options,
    ...mutatedNames,
    methodName,
    httpMethod,
    endpoint,
    typeImports,
  };
}

export async function apiGenerator(tree: Tree, options: ApiGeneratorSchema) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  // logger.debug({ normalizedOptions });
  const { directory } = await initializeGenerator(
    tree,
    normalizedOptions,
    'api'
  );


  generateFiles(tree, path.join(__dirname, 'files/src'), directory, normalizedOptions);

  if (normalizedOptions.useTypes) {
    tasks.push(await typesGenerator(tree, { ...normalizedOptions, skipFormat: true }))
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default apiGenerator;

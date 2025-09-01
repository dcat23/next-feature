import { runTasksInSerial } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { names } from '@nx/devkit';
import { generateFiles } from '@nx/devkit';
import { formatFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { initializeGenerator } from '../../lib/generator-config';
import constantGenerator from '../constant/constant';
import typesGenerator from '../types/types';
import type { HttpMethod } from './lib/types';
import { TYPE_IMPORT_SEPARATOR } from './lib/constants';
import { asTypeImport, extractHttpMethod } from './lib/utils';
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
  const hasRequestBody = (['post', 'put', 'patch'] as HttpMethod[]).includes(httpMethod);

  const defaultImports = [className, className.concat('Response')];
  /**
   * create type for methods that need a request body
   */
  if (hasRequestBody) {
    defaultImports.push(
      className.concat('Request')
    );
  }
  const typeImports = defaultImports
    .map(asTypeImport)
    .join(TYPE_IMPORT_SEPARATOR);

  const axiosImportPath = '../axios';

  return {
    tmpl: '',
    ...options,
    ...mutatedNames,
    methodName,
    httpMethod,
    endpoint,
    typeImports,
    hasRequestBody,
    axiosImportPath,
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
    for (const typeImport of normalizedOptions.typeImports.split(TYPE_IMPORT_SEPARATOR)) {
      tasks.push(await typesGenerator(tree, { ...normalizedOptions , name: typeImport, skipFormat: true }))
    }
  }

  if (normalizedOptions.useConstant) {
    tasks.push(await constantGenerator(tree, {
      ...normalizedOptions ,
      name: normalizedOptions.name,
      skipFormat: true
    }));
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default apiGenerator;

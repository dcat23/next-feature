import { logger } from '@nx/devkit';
import { names } from '@nx/devkit';
import { OverwriteStrategy } from '@nx/devkit';
import { generateFiles } from '@nx/devkit';
import { formatFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { initializeGenerator } from '../../lib/generator-config';
import { extractHttpMethod } from './lib/extract-http-method';
import type { NormalizedApiGeneratorSchema } from './schema';
import type { ApiGeneratorSchema } from './schema';



function normalize(options: ApiGeneratorSchema): NormalizedApiGeneratorSchema {
  options.projectName ??= 'features';
  options.directory ??= 'lib';

  const mutatedNames = names(options.name);
  const {  propertyName, className, name } = mutatedNames;
  const { method: httpMethod , noPrefix: noPrefixClassName } = extractHttpMethod(name);

  const methodName = propertyName;
  const responseType = noPrefixClassName
  const endpoint = names(responseType).fileName
    .split("-", 1).join()

  const asTypeImport = (dataType: string) => (dataType)

  const typeImports = [responseType, className]
    .map(asTypeImport)
    .join(", ")

  return {
    ...options,
    ...mutatedNames,
    methodName,
    httpMethod,
    responseType,
    endpoint,
    typeImports,
  };
}

export async function apiGenerator(tree: Tree, options: ApiGeneratorSchema) {
  const normalizedOptions = normalize(options);
  // logger.debug({ normalizedOptions });
  const { sourceRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'api'
  );

  const directory = path.join(
    sourceRoot,
    normalizedOptions.directory,
  );

  // logger.debug({ directory });

  generateFiles(tree, path.join(__dirname, 'files/src'), directory, {
    ...normalizedOptions,
    tmpl: '',
    overwriteStrategy: OverwriteStrategy.KeepExisting,
  });

  await formatFiles(tree);
}

export default apiGenerator;

import { names } from '@nx/devkit';
import * as path from 'path';
import {
  handleExportPath,
  normalizeCodeGenerator,
} from '../../../../../lib/utils/code-generator';
import {
  extractEndpoint,
  extractHttpMethod,
} from '../../../../../lib/utils/http-method';
import type {
  HookGeneratorSchema,
  NormalizedHookGeneratorSchema,
} from '../types';

function resolveActionImportPath(
  hookPackage: string,
  actionPackage: string,
  actionFileName: string
) {
  const relative =
    path.relative(hookPackage, actionPackage).split(path.sep).join('/') ||
    '.';
  const importPath = `${relative}/${actionFileName}`;

  return importPath.startsWith('.') ? importPath : `./${importPath}`;
}

/**
 * Normalize hook generator options
 */
export function normalize(
  options: HookGeneratorSchema
): NormalizedHookGeneratorSchema {
  // Set defaults
  options.package ??= 'hooks';
  options.actionPackage ??= 'lib/actions';
  options.clientPackage ??= '@next-feature/client';

  // normalize general options
  const normalized = normalizeCodeGenerator(options);

  // normalized hook specific schema
  const { method: httpMethod, noPrefix } = extractHttpMethod(
    normalized.names.name
  );
  const domain = names(noPrefix);
  const endpoint = extractEndpoint(domain.fileName);
  const queryType = httpMethod === 'get' ? 'query' : 'mutation';
  const methodName = normalized.names.propertyName;
  const hookName = 'use' + normalized.names.className;
  const requestType = normalized.names.className + 'Request';

  const hookFileName = normalized.names.fileName.startsWith('use-')
    ? normalized.names.fileName
    : `use-${normalized.names.fileName}`;

  normalized.outputFileName = `${hookFileName}.ts`;
  normalized.exportPath = handleExportPath(normalized);

  const actionFileName = options.actionFile ?? domain.fileName;
  const actionImportPath = resolveActionImportPath(
    normalized.package,
    options.actionPackage,
    actionFileName
  );

  return {
    ...normalized,
    domain,
    httpMethod,
    endpoint,
    queryType,
    methodName,
    hookName,
    requestType,
    actionImportPath,
  };
}
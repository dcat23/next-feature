import { names } from '@nx/devkit';
import * as path from 'path';
import { asOutputFile } from '../../../../../lib/utils/files';
import {
  handleExportPath,
  normalizeCodeGenerator,
} from '../../../../../lib/utils/code-generator';
import {
  extractEndpoint,
  extractHttpMethod,
} from '../../../../../lib/utils/http-method';
import type {
  ActionGeneratorSchema,
  NormalizedActionGeneratorSchema,
} from '../types';
import { DECLARATION_KINDS } from '../../../declaration/lib/types';

export { extractEndpoint, extractHttpMethod };

/** Contract types live in the data-type declaration location */
export const TYPES_PACKAGE = path.posix.join('lib', DECLARATION_KINDS['data-type'].subDirectory);
/** Mappers live in the utility declaration location */
export const UTILS_PACKAGE = path.posix.join('lib', DECLARATION_KINDS.utility.subDirectory);

function relativeImport(fromPackage: string, toPackage: string, fileName: string) {
  const relative = path.posix.relative(fromPackage, toPackage) || '.';
  const importPath = path.posix.join(relative, fileName);
  return importPath.startsWith('.') ? importPath : `./${importPath}`;
}

/** Client config (and prisma) location, see the client-config generator */
export const CONFIG_PACKAGE = 'lib/config';
export const DEFAULT_CLIENT_NAME = 'api';

function handleConfigImportPath(options: ActionGeneratorSchema) {
  const configFile = options.actionType === 'db' ? 'prisma' : 'client';
  return relativeImport(options.package, CONFIG_PACKAGE, configFile);
}

/**
 * Normalize action generator options
 */
export function normalize(
  options: ActionGeneratorSchema
): NormalizedActionGeneratorSchema {
  // Set defaults
  options.package ??= 'lib/actions'
  options.actionType ??= 'api';
  options.useTypes = Boolean(options.useTypes);
  options.useConstant = Boolean(options.useConstant);
  options.useMapper = Boolean(options.useMapper);
  options.useHook = Boolean(options.useHook);
  options.clientPackage ??= "@next-feature/client";

  // normalize general options
  const normalized = normalizeCodeGenerator(options);
  
  // normalized action specific schema
  const { method: httpMethod, noPrefix } = extractHttpMethod(
    normalized.names.name
  );
  const domain = names(noPrefix);
  const endpoint = extractEndpoint(domain.fileName);
  const methodName = normalized.names.propertyName;
  const hasRequestBody = /(post|put|patch)/.test(httpMethod);
  const mapperName = 'mapTo'.concat(normalized.names.className);
  const configImportPath = handleConfigImportPath(normalized)
  // db actions keep importing ../config/prisma's default export
  const requestedClient = normalized.actionType === 'db' || !options.apiClient
    ? DEFAULT_CLIENT_NAME
    : names(options.apiClient).propertyName;
  const useNamedClient = requestedClient !== DEFAULT_CLIENT_NAME;
  const clientName = requestedClient;
  // db/none actions return their result directly instead of wrapping it in withApi
  const useApi = /(api|form)/.test(normalized.actionType);
  const schemaName = methodName + 'Schema';
  const requestType = normalized.names.className + 'Request';
  const responseType = normalized.names.className + 'Response';
  const actionName = methodName + 'Action';
  const formActionName = methodName + 'FormAction';

  // finalize
  if (!options.file) {
    // sets file name to domain if file was not specified
    normalized.outputFileName = asOutputFile({ file: domain.fileName });
    // export path needs to be overidden with new ouputFileName
    normalized.exportPath = handleExportPath(normalized);
  }

  const baseFileName = path.parse(normalized.outputFileName).name;
  const typesOutputFile = path.posix.join(TYPES_PACKAGE, normalized.outputFileName);
  const typesImportPath = relativeImport(normalized.package, TYPES_PACKAGE, baseFileName);
  const mapperImportPath = relativeImport(normalized.package, UTILS_PACKAGE, baseFileName);
  const typesExportPath = handleExportPath({ package: TYPES_PACKAGE, outputFileName: normalized.outputFileName });
  const actionOutputFileName = `${baseFileName}.action.ts`;
  const formOutputFileName = `${baseFileName}.form.ts`;
  const serverImportPath = `./${baseFileName}`;

  return {
    ...normalized,
    httpMethod,
    endpoint,
    methodName,
    hasRequestBody,
    mapperName,
    domain,
    configImportPath,
    clientName,
    useNamedClient,
    useApi,
    schemaName,
    requestType,
    responseType,
    typesOutputFile,
    typesImportPath,
    typesExportPath,
    mapperImportPath,
    actionName,
    formActionName,
    actionOutputFileName,
    formOutputFileName,
    serverImportPath,
  };
}

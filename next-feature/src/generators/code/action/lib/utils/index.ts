import { logger, names } from '@nx/devkit';
import { asOutputFile } from 'next-feature/src/lib/utils/files';
import { Names } from '../../../../../lib/types';
import {
  handleExportPath,
  normalizeCodeGenerator,
} from '../../../../../lib/utils/code-generator';
import { pluralize, singularize } from '../../../../../lib/utils/string';
import type { HttpMethod } from '../constants';
import { PREFIXES, RESPONSE_TYPES } from '../constants';
import type {
  ActionGeneratorSchema,
  ActionType,
  NormalizedActionGeneratorSchema,
} from '../types';
import { apiContent } from './content';

/**
 * Extract HTTP method from action name
 * Examples:
 *   - "getUsers" -> { method: 'get', noPrefix: 'User' }
 *   - "createProducts" -> { method: 'post', noPrefix: 'Product' }
 *   - "updateStatuses" -> { method: 'put', noPrefix: 'Status' }
 */
export interface ExtractHttpMethod {
  method: HttpMethod;
  noPrefix: string;
}

export function extractHttpMethod(name: string): ExtractHttpMethod {
  const prefixesStr = (PREFIXES as readonly string[]).join('|');
  const pattern = new RegExp(`^(?<prefix>${prefixesStr})?(?<noPrefix>.*)`, 'i');

  const matches = name.match(pattern);

  if (!matches?.groups) {
    logger.debug(`No prefix match for: ${name}`);
    const singularized = singularize(names(name).className);
    return {
      method: 'post',
      noPrefix: singularized,
    };
  }

  const { prefix, noPrefix: _noPrefix } = matches.groups;

  const method = (RESPONSE_TYPES[prefix as keyof typeof RESPONSE_TYPES] ||
    'post') as HttpMethod;
  const className = names(_noPrefix).className;
  const noPrefix = singularize(className);

  return {
    method,
    noPrefix,
  };
}

function handleConfigImportPath(options: ActionGeneratorSchema) {
  return ["..","config",
    options.actionType === "db" ? "prisma" : "client"
  ].join("/");
}


function handleOutputFileName({ fileName, actionType }: {
  fileName: Names["fileName"],
  actionType: ActionType
}) {
  switch (actionType) {
    case "api":
      return fileName + "-api"
    case "form":
      return fileName + "-action"
    default:
      return fileName;
  }
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
  const content = apiContent;

  // finalize
  if (!options.file) {
    // sets file name to domain if file was not specified
    normalized.outputFileName = asOutputFile({ file: domain.fileName });
    // export path needs to be overidden with new ouputFileName
    normalized.exportPath = handleExportPath(normalized);
  }

  return {
    ...normalized,
    httpMethod,
    endpoint,
    methodName,
    hasRequestBody,
    mapperName,
    domain,
    configImportPath,
    content
  };
}


/**
 * [extract-endpoint]
 * next-feature@0.0.12
 * November 9th 2025, 1:37:44 pm
 */
export function extractEndpoint(text: string) {
  return names(text).fileName.split(/-/)
    .map(pluralize)
    .join("/")
}

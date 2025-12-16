import { logger, names } from '@nx/devkit';
import type { HttpMethod } from '../constants';
import { PREFIXES, RESPONSE_TYPES } from '../constants';
import type {
  ActionGeneratorSchema,
  NormalizedActionGeneratorSchema,
} from '../types';
import {
  handleExportPath,
  normalizeCodeGenerator,
} from '../../../../../lib/utils/code-generator';
import { pluralize, singularize } from '../../../../../lib/utils/string';
import { NormalizedCodeGeneratorSchema } from '../../../../../lib/types';
import path = require('node:path');

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


function handleOutputFileName(normalized: NormalizedCodeGeneratorSchema<ActionGeneratorSchema>) {
  const fileName = normalized.names.fileName;
  switch (normalized.actionType) {
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
  const normalized = normalizeCodeGenerator(options);
  normalized.actionType ??= 'api';
  normalized.useTypes = Boolean(normalized.useTypes);
  normalized.useConstant = Boolean(normalized.useConstant);
  normalized.useMapper = Boolean(normalized.useMapper);
  normalized.outputFileName = handleOutputFileName(normalized);
  normalized.exportPath = handleExportPath(normalized, "actions");

  const { method: httpMethod, noPrefix } = extractHttpMethod(
    normalized.names.name
  );

  const domain = names(noPrefix);
  const methodName = normalized.names.propertyName;
  const endpoint = extractEndpoint(domain.fileName);
  const hasRequestBody = ['post', 'put', 'patch'].includes(httpMethod);
  const mapperName = 'mapTo'.concat(normalized.names.className);

  const configImportPath = handleConfigImportPath(normalized)
  const clientImportPath = normalized.clientPackage || "../config/client";

  return {
    ...normalized,
    httpMethod,
    endpoint,
    methodName,
    hasRequestBody,
    mapperName,
    domain,
    configImportPath,
    clientImportPath,
  };
}

/**
 * Get file template path based on action type
 */
export function getActionTemplatePath(
  actionType: 'api' | 'db' | 'form'
): string {
  const paths: Record<string, string> = {
    api: 'api',
    db: 'db',
    form: 'form',
  };
  return paths[actionType] || 'api';
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

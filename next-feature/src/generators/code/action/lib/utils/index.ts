import { names } from '@nx/devkit';
import { asOutputFile } from 'next-feature/src/lib/utils/files';
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
import { apiContent } from './content';

export { extractEndpoint, extractHttpMethod };

function handleConfigImportPath(options: ActionGeneratorSchema) {
  return ["..","config",
    options.actionType === "db" ? "prisma" : "client"
  ].join("/");
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

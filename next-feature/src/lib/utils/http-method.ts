import { logger, names } from '@nx/devkit';
import { PREFIXES, RESPONSE_TYPES, type HttpMethod } from '../constants/http-method';
import { pluralize, singularize } from './string';

export interface ExtractHttpMethod {
  method: HttpMethod;
  noPrefix: string;
}

/**
 * Derives an HTTP method and the resource name (with any recognized verb
 * prefix stripped) from a code-generator name, e.g. "getUsers" -> { method: 'get', noPrefix: 'User' }
 */
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

export function extractEndpoint(text: string) {
  return names(text)
    .fileName.split(/-/)
    .reverse()
    .map(pluralize)
    .join('/');
}
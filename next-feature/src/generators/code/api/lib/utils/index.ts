import { logger, names } from '@nx/devkit';
import { PREFIXES, RESPONSE_TYPES } from '../constants';
import type { HttpMethod } from '../types';

/**
 * [as-type-import]
 * August 4th 2025, 10:36:30 am
 */
export function asTypeImport(dataType: string) {
  return dataType;
}

interface ExtractHttpMethod {
  method: HttpMethod,
  /**
   * The className representation
   */
  noPrefix: string;
}

/**
 * [extract-http-method]
 * August 4th 2025, 10:38:58 am
 * @param name
 * @returns ExtractHttpMethod the http method and the className representation
 * of `name`
 */
export function extractHttpMethod(name: string): ExtractHttpMethod {
  const prefixes = PREFIXES.join("|");
  const pattern = new RegExp(`^(?<prefix>${prefixes})?(?<noPrefix>.*)`, "i");

  const matches = (name).match(pattern);

  if (!(matches && matches.groups)) {
    logger.debug("no match: " + name);
    return {
      method: 'post',
      noPrefix: names(name).className
    }
  }

  const { prefix, noPrefix: _noPrefix } = matches.groups

  const method = (RESPONSE_TYPES[prefix] || "post") as HttpMethod;
  const noPrefix = names(_noPrefix).className

  return {
    method,
    noPrefix
  }
}

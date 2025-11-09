import { logger, names } from '@nx/devkit';
import { PREFIXES, RESPONSE_TYPES } from '../constants';
import type { HttpMethod } from '../types';
import { singularize } from '../../../../../lib/utils/string';

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
   * The singularized className representation
   */
  noPrefix: string;
}

/**
 * [extract-http-method]
 * August 4th 2025, 10:38:58 am
 * @param name
 * @returns ExtractHttpMethod the http method and the singularized className representation
 * of `name`
 */
export function extractHttpMethod(name: string): ExtractHttpMethod {
  const prefixes = PREFIXES.join("|");
  const pattern = new RegExp(`^(?<prefix>${prefixes})?(?<noPrefix>.*)`, "i");

  const matches = (name).match(pattern);

  if (!(matches && matches.groups)) {
    logger.debug("no match: " + name);
    const singularized = singularize(names(name).className);
    return {
      method: 'post',
      noPrefix: singularized
    }
  }

  const { prefix, noPrefix: _noPrefix } = matches.groups

  const method = (RESPONSE_TYPES[prefix] || "post") as HttpMethod;
  const className = names(_noPrefix).className;
  const noPrefix = singularize(className);

  return {
    method,
    noPrefix
  }
}

import { logger } from '@nx/devkit';
import { names } from '@nx/devkit';

export const PREFIXES= [
  /* GET */
  'read',
  'get',
  'fetch',
  'view',
  'list',
  'browse',
  /* POST */
  'add',
  'create',
  'insert',
  'post',
  'send',
  /* PUT */
  'submit',
  'update',
  'edit',
  'modify',
  'enable',
  /* DELETE */
  'delete',
  'remove',
  'disable',
  'destroy',
  /* OTHER */
  'use',
  'with',
  'start',
]

export type Prefix = typeof PREFIXES[number]
export type HttpMethod = "get" | "post" | "put" | "delete";

export const responseTypes: Record<Prefix, HttpMethod> = {
  read: "get",
  get: "get",
  fetch: "get",
  view: "get",
  list: "get",
  browse: "get",
  add: "post",
  create: "post",
  insert: "post",
  post: "post",
  send: "post",
  submit: "post",
  update: 'put',
  edit: 'put',
  modify: 'put',
  enable: 'put',
  delete: 'delete',
  remove: 'delete',
  disable: 'delete',
  destroy: 'delete',
  use: 'get',
  with: 'get',
  start: 'post'
}

interface ExtractHttpMethod {
  method: HttpMethod,
  /**
   * The className representation
   */
  noPrefix: string;
}

/**
 *
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

  const method = (responseTypes[prefix] || "post") as HttpMethod;
  const noPrefix = names(_noPrefix).className

  return {
    method,
    noPrefix
  }
}

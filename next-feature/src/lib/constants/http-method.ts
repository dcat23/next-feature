/**
 * HTTP Methods
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Prefixes that map to HTTP methods for API actions
 */
export const PREFIXES = [
  /* GET */
  'read',
  'get',
  'fetch',
  'view',
  'list',
  'browse',
  'show',
  /* POST */
  'add',
  'create',
  'insert',
  'post',
  'submit',
  'send',
  'upload',
  /* PUT */
  'update',
  'edit',
  'modify',
  'enable',
  /* PATCH */
  'patch',
  'set',
  'toggle',
  /* DELETE */
  'delete',
  'remove',
  'disable',
  'destroy',
  /* OTHER */
  'use',
  'with',
  'start',
] as const;

/**
 * Mapping of prefix to HTTP method
 */
export const RESPONSE_TYPES: Record<(typeof PREFIXES)[number], HttpMethod> = {
  read: 'get',
  get: 'get',
  fetch: 'get',
  view: 'get',
  list: 'get',
  browse: 'get',
  show: 'get',
  create: 'post',
  insert: 'post',
  post: 'post',
  send: 'post',
  submit: 'post',
  add: 'post',
  update: 'put',
  edit: 'put',
  modify: 'put',
  enable: 'put',
  patch: 'patch',
  set: 'patch',
  delete: 'delete',
  remove: 'delete',
  disable: 'delete',
  destroy: 'delete',
  use: 'get',
  with: 'get',
  start: 'post',
  upload: 'post',
  toggle: 'patch',
};
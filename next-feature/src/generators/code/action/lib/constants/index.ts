/**
 * HTTP Methods
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Action Type Constants
 */
export const ACTION_TYPES = ['api', 'db', 'form'] as const;

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
  'send',
  /* PUT */
  'submit',
  'update',
  'edit',
  'modify',
  'enable',
  /* PATCH */
  'patch',
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
  add: 'post',
  create: 'post',
  insert: 'post',
  post: 'post',
  send: 'post',
  submit: 'put',
  update: 'put',
  edit: 'put',
  modify: 'put',
  enable: 'put',
  patch: 'patch',
  delete: 'delete',
  remove: 'delete',
  disable: 'delete',
  destroy: 'delete',
  use: 'get',
  with: 'get',
  start: 'post',
};

export const TYPE_IMPORT_SEPARATOR = ', ';

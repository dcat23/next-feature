import type { HttpMethod, Prefix } from '../types';

/**
 * [prefixes]
 * August 4th 2025, 10:14:28 am
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
  /* DELETE */
  'delete',
  'remove',
  'disable',
  'destroy',
  /* OTHER */
  'use',
  'with',
  'start',
];

/**
 * [response-types]
 * August 4th 2025, 10:19:02 am
 */
export const RESPONSE_TYPES: Record<Prefix, HttpMethod> = {
  read: 'get',
  get: 'get',
  fetch: 'get',
  view: 'get',
  list: 'get',
  browse: 'get',
  add: 'post',
  create: 'post',
  insert: 'post',
  post: 'post',
  send: 'post',
  submit: 'post',
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
  start: 'post',
};

/**
 * [type-import-separator]
 * August 4th 2025, 10:21:34 am
 */
export const TYPE_IMPORT_SEPARATOR =  ', ';

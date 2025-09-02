import { PREFIXES } from '../constants';

/**
 * [prefix]
 * August 4th 2025, 10:16:47 am
 */
export type Prefix = (typeof PREFIXES)[number];

/**
 * [http-method]
 * August 4th 2025, 10:17:28 am
 */
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete"

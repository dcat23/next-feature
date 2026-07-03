import type { HttpMethod } from '../../../../../lib/constants/http-method';
import {
  CodeGeneratorSchema,
  Names,
  NormalizedCodeGeneratorSchema,
} from '../../../../../lib/types';

/**
 * Hook Generator Schema - extends CodeGeneratorSchema
 */
export interface HookGeneratorSchema extends CodeGeneratorSchema {
  /**
   * Subdirectory within src/ where the wrapped action lives.
   * Defaults to 'lib/actions', matching the action generator's default.
   */
  actionPackage?: string;

  /**
   * Exact file (without extension) the wrapped action was written to,
   * if it differs from the default resource-based name.
   */
  actionFile?: string;

  /**
   * Client package to import ApiError from (e.g., @myfeature/client)
   * Defaults to @next-feature/client if not provided
   */
  clientPackage?: string;
}

/**
 * Normalized Hook Generator Schema
 */
export interface NormalizedHookGeneratorSchema
  extends NormalizedCodeGeneratorSchema<HookGeneratorSchema> {
  domain: Names;
  httpMethod: HttpMethod;
  endpoint: string;
  queryType: 'query' | 'mutation';
  methodName: string;
  hookName: string;
  requestType: string;
  actionImportPath: string;
}
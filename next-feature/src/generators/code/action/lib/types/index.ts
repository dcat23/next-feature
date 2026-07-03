import type { HttpMethod } from '../../../../../lib/constants/http-method';
import {
  CodeGeneratorSchema,
  Names,
  NormalizedCodeGeneratorSchema,
} from '../../../../../lib/types';

/**
 * Action types - determines what kind of action to generate
 */
export type ActionType = 'api' | 'db' | 'form' | 'none'; // none added to skip withApi usage

/**
 * Action Generator Schema - extends CodeGeneratorSchema
 */
export interface ActionGeneratorSchema extends CodeGeneratorSchema {
  /**
   * Type of action to generate
   */
  actionType: ActionType;

  /**
   * For API actions: Generate types
   */
  useTypes?: boolean;

  /**
   * For API actions: Generate constants
   */
  useConstant?: boolean;

  /**
   * For API actions: Generate mapper function
   */
  useMapper?: boolean;

  /**
   * Generate a TanStack Query hook (useQuery/useMutation) wrapping this action.
   * Ignored when actionType is 'form'.
   */
  useHook?: boolean;

  /**
   * Client package to import from (e.g., @myfeature/client)
   * Defaults to @next-feature/client if not provided
   */
  clientPackage?: string;
}

/**
 * Normalized Action Generator Schema
 */
export interface NormalizedActionGeneratorSchema extends NormalizedCodeGeneratorSchema<ActionGeneratorSchema> {
  // For API actions
  domain: Names;
  httpMethod: HttpMethod;
  endpoint: string;
  methodName: string;
  hasRequestBody: boolean;
  mapperName?: string;
  configImportPath: string

  content: (options: NormalizedCodeGeneratorSchema) => string;
}

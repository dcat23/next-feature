import type { HttpMethod } from '../constants';
import {
  CodeGeneratorSchema,
  Names,
  NormalizedCodeGeneratorSchema,
} from '../../../../../lib/types';

/**
 * Action types - determines what kind of action to generate
 */
export type ActionType = 'api' | 'db' | 'form';

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
  httpMethod: HttpMethod;
  endpoint: string;
  methodName: string;
  hasRequestBody: boolean;
  mapperName?: string;
  domain: Names;
  configImportPath: string
  clientImportPath: string;
  fileName: string;
}

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
  mapperImportPath: string; // relative to the action package
  configImportPath: string

  // Request/Response contract, written to the data-type location
  schemaName: string;
  requestType: string;
  responseType: string;
  typesOutputFile: string; // relative to sourceRoot
  typesImportPath: string; // relative to the action package
  typesExportPath: string;

  // 'use server' wrappers for client-originated calls
  actionName: string;
  formActionName: string;
  actionOutputFileName: string;
  formOutputFileName: string;
  serverImportPath: string; // wrapper -> server-only action
}

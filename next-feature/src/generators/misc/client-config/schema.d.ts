import type { CodeGeneratorSchema } from '../../../lib/types';

export interface ClientConfigGeneratorSchema
  extends Omit<CodeGeneratorSchema, 'name' | 'file'> {
  /** Client name, exported from lib/config/client.ts (default: api) */
  name?: string;
  /** Env var holding the base URL (default: <PROJECT>_API_URL for api, <NAME>_API_URL otherwise) */
  envVar?: string;
  clientPackage?: string;
  /** @deprecated ignored: each client reads its base URL from its env var */
  baseUrl?: string;
  /** @deprecated ignored: the generated file has no interceptor examples */
  includeInterceptors?: boolean;
}

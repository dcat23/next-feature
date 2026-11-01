import type { CodeGeneratorSchema } from '../../../lib/types';

export interface ClientConfigGeneratorSchema
  extends Omit<CodeGeneratorSchema, 'name' | 'file'> {
  /** Client name, exported from lib/config/client.ts (default: api) */
  name?: string;
  /** Env var holding the base URL (default: <PROJECT>_API_URL for api, <NAME>_API_URL otherwise) */
  envVar?: string;
  clientPackage?: string;
  /** @deprecated unused by the template */
  baseUrl?: string;
  /** @deprecated unused by the template */
  includeInterceptors?: boolean;
}

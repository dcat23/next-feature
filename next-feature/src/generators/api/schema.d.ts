import type { LibGeneratorSchema, Normalized } from '../../lib/types';

export interface ApiGeneratorSchema extends LibGeneratorSchema {
  name: string;
  useTypes?: boolean;
}

export interface NormalizedApiGeneratorSchema extends Normalized<ApiGeneratorSchema> {
  fileName: string;
  endpoint: string;
  methodName: string;
  httpMethod: string;
  responseType: string;
  typeImports: string;
}

import type { WithNames } from '../../../lib/types';
import type { GeneratorSchema, Normalized } from '../../../lib/types';

export interface ApiGeneratorSchema extends GeneratorSchema {
  name: string;
  useTypes?: boolean;
  useConstant?: boolean;
  useMapper?: boolean
}

export interface NormalizedApiGeneratorSchema extends Normalized<WithNames<ApiGeneratorSchema>> {
  fileName: string;
  endpoint: string;
  methodName: string;
  httpMethod: string;
  typeImports: string;
  hasRequestBody: boolean;
  axiosImportPath: string;
  mapperName: string;
  domainClassName: string;
}

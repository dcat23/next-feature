import type { CodeGeneratorSchema, NormalizedCodeGeneratorSchema } from '../../../lib/types';

export interface AxiosGeneratorSchema extends CodeGeneratorSchema {
  appProjectName?: string;
  skipFiles?: boolean
  useInterceptor?: boolean
}

export interface NormalizedAxiosGeneratorSchema extends NormalizedCodeGeneratorSchema<AxiosGeneratorSchema> {
  keyName: string;
  apiName: string;
}

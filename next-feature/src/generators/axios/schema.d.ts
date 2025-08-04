import type { GeneratorSchema, Normalized } from '../../lib/types';

export interface AxiosGeneratorSchema extends GeneratorSchema {
  appProjectName?: string; //
}

export interface NormalizedAxiosGeneratorSchema extends Normalized<AxiosGeneratorSchema> {
  keyName: string;
}

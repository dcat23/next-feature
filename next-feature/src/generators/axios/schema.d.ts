import type { GeneratorSchema, Normalized } from '../../lib/types';

export interface AxiosGeneratorSchema extends GeneratorSchema {
  name: string;
  appProjectName?: string;
  skipFiles?: boolean
}

export interface NormalizedAxiosGeneratorSchema extends Normalized<AxiosGeneratorSchema> {
  keyName: string;
}

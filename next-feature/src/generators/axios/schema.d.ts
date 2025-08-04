import type { GeneratorSchema, Normalized } from '../../lib/types';
import type { FeatureGeneratorSchema } from '../feature/schema';

export interface AxiosGeneratorSchema extends GeneratorSchema {
  projectName: FeatureGeneratorSchema['name'];
  appProjectName?: string; //
}

export interface NormalizedAxiosGeneratorSchema extends Normalized<AxiosGeneratorSchema> {
  keyName: string;
}

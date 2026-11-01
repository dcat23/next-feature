import {
  NormalizedProjectGeneratorSchema,
  ProjectGeneratorSchema,
} from '../../../lib/types';

export type FeatureType = 'logging' | 'generic' | 'client' | 'auth' | 'ui';

export interface FeatureGeneratorSchema extends ProjectGeneratorSchema {
  name: string;
  directory?: "features" | string;
  orgName?: "feature" | string;
  type?: FeatureType;
}

export interface NormalizedFeatureGeneratorSchema extends NormalizedProjectGeneratorSchema<FeatureGeneratorSchema> {
  directory: string;
  type: FeatureType;
}

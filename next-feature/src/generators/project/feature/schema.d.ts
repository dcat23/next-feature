import {
  NormalizedProjectGeneratorSchema,
  ProjectGeneratorSchema,
} from '../../../lib/types';

export type FeatureType = 'base' | 'logging' | 'generic' | 'client' | 'auth';

export interface FeatureGeneratorSchema extends ProjectGeneratorSchema {
  name: "base" | string;
  directory?: "features" | string;
  orgName?: "feature" | string;
  type?: FeatureType;
  useAxios?: boolean;
}

export interface NormalizedFeatureGeneratorSchema extends NormalizedProjectGeneratorSchema<FeatureGeneratorSchema> {
  directory: string;
  apiKeyName: string;
  type: FeatureType;
}

import {
  NormalizedProjectGeneratorSchema,
  ProjectGeneratorSchema,
} from '../../../lib/types';

export interface FeatureGeneratorSchema extends ProjectGeneratorSchema {
  name: "base" | string;
  directory?: "features" | string;
  useAxios?: boolean;
  useAuth?: boolean;
}

export interface NormalizedFeatureGeneratorSchema extends NormalizedProjectGeneratorSchema<FeatureGeneratorSchema> {
  apiKeyName: string;
}

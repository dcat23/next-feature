import type { WithNames } from '../../lib/types';

export interface FeatureGeneratorSchema {
  name: "base" | string;
  directory?: "features" | string;
  useAxios?: boolean;
  useAuth?: boolean;
  skipFormat?: boolean;
}

export interface NormalizedFeatureGeneratorSchema extends FeatureGeneratorSchema {
  tmpl: "";
  projectRoot: string;
  sourceRoot: string;
  importPath: string;
  apiKeyName: string;
}

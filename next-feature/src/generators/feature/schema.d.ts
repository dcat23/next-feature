
export interface FeatureGeneratorSchema {
  name: string;
  srcPath?: string;
  directory?: string;
  useAxios?: boolean;
  useAuth?: boolean;
  useDb?: boolean;
  useAll?: boolean;
}

export interface NormalizedFeatureGeneratorSchema extends FeatureGeneratorSchema {
  projectRoot: string;
  sourceRoot: string;
}

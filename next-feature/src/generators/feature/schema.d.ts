
export interface FeatureGeneratorSchema {
  name?: "features" | string;
  srcPath?: string;
  directory?: string;
  useAxios?: boolean;
}

export interface NormalizedFeatureGeneratorSchema extends FeatureGeneratorSchema {
  projectRoot: string;
  sourceRoot: string;
}


export interface FeatureGeneratorSchema {
  name?: "features" | string;
  srcPath?: string;
  directory?: string;
}

export interface NormalizedFeatureGeneratorSchema extends FeatureGeneratorSchema {
  projectRoot: string;
  sourceRoot: string;
}

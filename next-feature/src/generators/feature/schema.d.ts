
export interface FeatureGeneratorSchema {
  name: "features" | string;
  directory?: string;
  srcPath?: string;
  useAxios?: boolean;
  useAuth?: boolean;
  useDb?: boolean;
  useAll?: boolean;
}

export interface NormalizedFeatureGeneratorSchema extends FeatureGeneratorSchema {
  projectRoot: string;
  sourceRoot: string;
  tmpl: "";
}

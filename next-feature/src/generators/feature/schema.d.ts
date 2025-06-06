
export interface FeatureGeneratorSchema {
  name: "base" | string;
  directory?: string;
  srcPath?: string;
  useAxios?: boolean;
  useAuth?: boolean;
  useDb?: boolean;
  useAll?: boolean;
  skipFormat?: boolean;
}

export interface NormalizedFeatureGeneratorSchema extends FeatureGeneratorSchema {
  tmpl: "";
  projectRoot: string;
  sourceRoot: string;
  importPath: string;
}

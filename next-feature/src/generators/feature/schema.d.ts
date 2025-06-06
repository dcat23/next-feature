
export interface FeatureGeneratorSchema {
  name: "base" | string;
  directory?: string;
  useAxios?: boolean;
  skipFormat?: boolean;
}

export interface NormalizedFeatureGeneratorSchema extends FeatureGeneratorSchema {
  tmpl: "";
  projectRoot: string;
  sourceRoot: string;
  importPath: string;
}

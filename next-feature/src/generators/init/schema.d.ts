export interface InitGeneratorSchema {
  srcPath?: string;
}

export interface NormalizedInitGeneratorSchema extends InitGeneratorSchema {
  projectRoot: string;
}

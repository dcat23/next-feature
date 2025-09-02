import type { GeneratorSchema, Normalized } from '../../lib/types';

export interface AuthGeneratorSchema extends GeneratorSchema {
  projectName: string;
}

export interface NormalizedAuthGeneratorSchema extends Normalized<AuthGeneratorSchema> {
  tmpl: ""
}

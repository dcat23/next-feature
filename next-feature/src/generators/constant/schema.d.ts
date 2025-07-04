import type { Names } from '../../lib/types';
import type { GeneratorSchema, Normalized, WithNames } from '../../lib/types';

export interface ConstantGeneratorSchema extends GeneratorSchema {
  name: string;
  file?: string | boolean;
}

export interface NormalizedConstantGeneratorSchema extends Normalized<WithNames<ConstantGeneratorSchema>> {
  tmpl: "",
  outputFileName: Names["fileName"] // appended with extension
}

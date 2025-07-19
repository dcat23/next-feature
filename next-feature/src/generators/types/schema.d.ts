import type { WithNames } from '../../lib/types';
import type { GeneratorSchema, Normalized } from '../../lib/types';

export interface TypesGeneratorSchema extends GeneratorSchema {
  name: string;
}

export interface NormalizedTypesGeneratorSchema extends Normalized<WithNames<TypesGeneratorSchema>> {
  tmpl: "";
}

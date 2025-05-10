import type { WithNames } from '../../lib/types';
import type { GeneratorSchema, Normalized } from '../../lib/types';

export interface ComponentGeneratorSchema extends GeneratorSchema {
  name: string;
}

export interface NormalizedComponentGeneratorSchema extends Normalized<WithNames<ComponentGeneratorSchema>> {

}

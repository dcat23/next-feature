import type { GeneratorSchema, Normalized } from '../../lib/types';
import type { FeatureGeneratorSchema } from '../feature/schema';

export interface AuthGeneratorSchema extends GeneratorSchema {
  name: FeatureGeneratorSchema['name'];
}

export interface NormalizedAuthGeneratorSchema extends Normalized<AuthGeneratorSchema> {

}

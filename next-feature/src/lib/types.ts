import type { FeatureGeneratorSchema } from '../generators/feature/schema';

export interface GeneratorSchema {
  featureProject: FeatureGeneratorSchema['name'];
  skipFormat?: boolean;
}

export type Normalized<Schema extends GeneratorSchema> = Schema & {

}

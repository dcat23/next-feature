import type { FeatureGeneratorSchema } from '../generators/feature/schema';

export interface GeneratorSchema {
  projectName: FeatureGeneratorSchema['name'];
  skipFormat?: boolean;
}

export type Normalized<Schema extends GeneratorSchema> = Schema & {

}

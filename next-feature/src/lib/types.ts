import type { FeatureGeneratorSchema } from '../generators/feature/schema';

export interface GeneratorSchema {
  projectName: FeatureGeneratorSchema['name'];
  directory?: string;
  skipFormat?: boolean;
}

export type Normalized<Schema extends GeneratorSchema> = Schema & {

}

export type LibGeneratorSchema = GeneratorSchema & {

}

import type { names } from '@nx/devkit';
import type { FeatureGeneratorSchema } from '../generators/feature/schema';

export interface GeneratorSchema {
  name: string;
  projectName?: FeatureGeneratorSchema['name'];
  directory?: FeatureGeneratorSchema['directory'];
  package?: 'lib' | string;
  skipFormat?: boolean;
}

export type Normalized<Schema extends GeneratorSchema> = Schema & {
  tmpl: ""
}

export type Names = ReturnType<typeof names>;

export type WithNames<T extends GeneratorSchema> = Names & T;

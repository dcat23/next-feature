import type { GeneratorSchema, Normalized } from '../../lib/types';

export interface DatabaseGeneratorSchema extends GeneratorSchema {
  projectName: string
}

export interface NormalizedDatabaseGeneratorSchema extends Normalized<DatabaseGeneratorSchema> {

}

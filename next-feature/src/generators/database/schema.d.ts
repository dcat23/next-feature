import type { GeneratorSchema, Normalized } from '../../lib/types';

export interface DatabaseGeneratorSchema extends GeneratorSchema {
}

export interface NormalizedDatabaseGeneratorSchema extends Normalized<DatabaseGeneratorSchema> {

}

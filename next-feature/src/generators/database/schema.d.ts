import type { GeneratorSchema, Normalized } from '../../lib/types';

export interface DatabaseGeneratorSchema extends GeneratorSchema {
  driver?: 'postgresql' | 'mysql';
}

export interface NormalizedDatabaseGeneratorSchema extends Normalized<DatabaseGeneratorSchema> {
  databaseName: string;
  port: number
}

import type { CodeGeneratorSchema, NormalizedCodeGeneratorSchema } from '../../../lib/types';

export interface DatabaseGeneratorSchema extends CodeGeneratorSchema {
  driver?: 'postgresql' | 'mysql';
}

export interface NormalizedDatabaseGeneratorSchema extends NormalizedCodeGeneratorSchema<DatabaseGeneratorSchema> {
  databaseName: string;
  port: number
}

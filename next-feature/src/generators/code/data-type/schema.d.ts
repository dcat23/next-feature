import {
  CodeGeneratorSchema,
  NormalizedCodeGeneratorSchema,
} from '../../../lib/types';

export interface DataTypeGeneratorSchema extends CodeGeneratorSchema {}

export interface NormalizedDataTypeGeneratorSchema extends NormalizedCodeGeneratorSchema<DataTypeGeneratorSchema> {}

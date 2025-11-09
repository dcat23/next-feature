import {
  CodeGeneratorSchema,
  NormalizedCodeGeneratorSchema,
} from '../../../lib/types';

export interface AuthGeneratorSchema extends CodeGeneratorSchema {}

export interface NormalizedAuthGeneratorSchema extends NormalizedCodeGeneratorSchema<AuthGeneratorSchema> {}

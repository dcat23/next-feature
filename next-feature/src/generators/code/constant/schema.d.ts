import type {
  CodeGeneratorSchema,
  NormalizedCodeGeneratorSchema,
} from '../../../lib/types';

export interface ConstantGeneratorSchema extends CodeGeneratorSchema {}

export interface NormalizedConstantGeneratorSchema extends NormalizedCodeGeneratorSchema<ConstantGeneratorSchema> {}

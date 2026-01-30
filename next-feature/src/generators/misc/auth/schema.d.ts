import {
  CodeGeneratorSchema,
  NormalizedCodeGeneratorSchema,
} from '../../../lib/types';

export interface AuthGeneratorSchema extends CodeGeneratorSchema {
  projectName: string;
}

export interface NormalizedAuthGeneratorSchema extends NormalizedCodeGeneratorSchema<AuthGeneratorSchema> {}

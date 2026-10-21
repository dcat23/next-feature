import type {
  CodeGeneratorSchema,
  NormalizedCodeGeneratorSchema,
} from '../../../lib/types';
import type { DeclarationKind } from './lib/types';

export interface DeclarationGeneratorSchema extends CodeGeneratorSchema {
  kind: DeclarationKind;
}

export type NormalizedDeclarationGeneratorSchema =
  NormalizedCodeGeneratorSchema<DeclarationGeneratorSchema>;
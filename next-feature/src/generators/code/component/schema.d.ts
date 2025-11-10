import { CodeGeneratorSchema, NormalizedCodeGeneratorSchema } from '../../../lib/types';

export interface ComponentGeneratorSchema extends CodeGeneratorSchema {
  componentType: "component" | "page" | "layout" | "modal" | "card" | "form" | "provider"
}

export interface NormalizedComponentGeneratorSchema extends NormalizedCodeGeneratorSchema<ComponentGeneratorSchema> {
}

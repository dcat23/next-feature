import { CodeGeneratorSchema, NormalizedCodeGeneratorSchema } from '../../../lib/types';

export interface ComponentGeneratorSchema extends CodeGeneratorSchema {
  componentType: "component" | "page" | "layout" | "modal" | "card" | "form" | "provider" | "hook"
}

export interface NormalizedComponentGeneratorSchema extends NormalizedCodeGeneratorSchema<ComponentGeneratorSchema> {
  // Set when componentType is 'hook': the exported hook function name (use<ClassName>)
  hookName?: string;
}

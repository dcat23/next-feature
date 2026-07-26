import { CodeGeneratorSchema, NormalizedCodeGeneratorSchema } from '../../../lib/types';

export interface ComponentGeneratorSchema extends CodeGeneratorSchema {
  componentType: "component" | "page"
  kind?: "generic" | "modal" | "card" | "form"
       | "layout" | "loading" | "error" | "not-found"
       | "template" | "default" | "global-error" | "route"
  inferPath?: boolean
}

export interface NormalizedComponentGeneratorSchema extends NormalizedCodeGeneratorSchema<ComponentGeneratorSchema> {
  kind: NonNullable<ComponentGeneratorSchema['kind']>;
}

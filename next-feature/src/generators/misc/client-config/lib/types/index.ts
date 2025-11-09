import type { ClientConfigGeneratorSchema } from '../../schema.d';

export interface NormalizedClientConfigGeneratorSchema
  extends ClientConfigGeneratorSchema {
  projectPath: string;
  sourceRoot: string;
  clientImportPath: string;
}

export type { ClientConfigGeneratorSchema };

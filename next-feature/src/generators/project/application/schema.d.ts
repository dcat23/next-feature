import type { NormalizedProjectGeneratorSchema, ProjectGeneratorSchema } from '../../../lib/types';

export interface ApplicationGeneratorSchema extends ProjectGeneratorSchema {
  useAuth?: boolean;
  useSrc?: boolean;  
  skipLogging?: boolean;
  skipShadcn?: boolean;
}

export type NormalizedApplicationGeneratorSchema = NormalizedProjectGeneratorSchema<ApplicationGeneratorSchema>;

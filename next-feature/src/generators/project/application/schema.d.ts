import type { NormalizedProjectGeneratorSchema, ProjectGeneratorSchema } from '../../../lib/types';

export interface ApplicationGeneratorSchema extends ProjectGeneratorSchema {
  useAuth?: boolean;
  useSrc?: boolean;
}

export interface NormalizedApplicationGeneratorSchema extends NormalizedProjectGeneratorSchema<ApplicationGeneratorSchema> {
}

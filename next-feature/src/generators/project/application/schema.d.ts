import type { NormalizedProjectGeneratorSchema, ProjectGeneratorSchema } from '../../../lib/types';

export interface ApplicationGeneratorSchema extends ProjectGeneratorSchema {
  env?: boolean;
  useAuth?: boolean;
  useSrc?: boolean;
}

export interface NormalizedApplicationGeneratorSchema extends NormalizedProjectGeneratorSchema<ApplicationGeneratorSchema> {
}

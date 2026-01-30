import { ProjectGeneratorSchema, NormalizedProjectGeneratorSchema } from '../../../lib/types';

export interface ClientGeneratorSchema extends ProjectGeneratorSchema {
  directory?: "clients" | string;
  orgName?: "client" | string;
}

export interface NormalizedClientGeneratorSchema extends NormalizedProjectGeneratorSchema<ClientGeneratorSchema> {
  apiKeyName: string;
}

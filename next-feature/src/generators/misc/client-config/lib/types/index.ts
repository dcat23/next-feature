import type { NormalizedCodeGeneratorSchema } from '../../../../../lib/types';
import type { ClientConfigGeneratorSchema } from '../../schema.d';

export interface NormalizedClientConfigGeneratorSchema
  extends NormalizedCodeGeneratorSchema<ClientConfigGeneratorSchema & { name: string }> {
  /** Exported const, e.g. `api`, `payments` */
  clientName: string;
  /** Whether this is the project's default client (`api`) */
  isDefault: boolean;
  clientImportPath: string;
}

export type { ClientConfigGeneratorSchema };

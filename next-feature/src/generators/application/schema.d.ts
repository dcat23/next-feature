import type { Normalized } from '../../lib/types';

export interface ApplicationGeneratorSchema {
  name: string;
  directory?: string;
  useAxios?: boolean;
  useAuth?: boolean;
  useDb?: boolean;
  useAll?: boolean;
  skipFormat?: boolean;
}

export interface NormalizedApplicationGeneratorSchema extends Normalized<ApplicationGeneratorSchema> {
  projectRoot: string;
  sourceRoot: string;
  importPath: string;
}

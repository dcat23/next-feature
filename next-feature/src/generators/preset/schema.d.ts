import type { Normalized } from '../../lib/types';

export interface PresetGeneratorSchema {
  name: string;
  directory?: string;
  useAxios?: boolean;
  useAuth?: boolean;
  useDb?: boolean;
  useAll?: boolean;
  skipFormat?: boolean;
}

export interface NormalizedPresetGeneratorSchema extends Normalized<PresetGeneratorSchema> {
  projectRoot: string;
  sourceRoot: string;
  tmpl: "";
  importPath: string;
}

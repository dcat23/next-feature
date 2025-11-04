import type { Normalized } from '../../lib/types';

export interface PresetGeneratorSchema {
  name: string;
  skipFormat?: boolean;
}

export interface NormalizedPresetGeneratorSchema extends Normalized<PresetGeneratorSchema> {
  projectRoot: string;
}

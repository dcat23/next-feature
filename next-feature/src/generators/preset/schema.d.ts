import type { ProjectGeneratorSchema, Normalized } from '../../lib/types';

export interface PresetGeneratorSchema extends ProjectGeneratorSchema {
  name: string;
  skipFormat?: boolean;
}

export interface NormalizedPresetGeneratorSchema extends Normalized<PresetGeneratorSchema> {
  projectRoot: string;
}

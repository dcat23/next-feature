import type { ProjectGeneratorSchema, Normalized } from '../../lib/types';

export interface PresetGeneratorSchema extends ProjectGeneratorSchema {
  name: string;
  /** Generate the GitHub Actions CI workflow (default: true) */
  ci?: boolean;
  skipFormat?: boolean;
}

export interface NormalizedPresetGeneratorSchema extends Normalized<PresetGeneratorSchema> {
  projectRoot: string;
  title: string;
}

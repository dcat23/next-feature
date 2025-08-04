import type { GeneratorSchema, Normalized, WithNames } from '../../lib/types';

export interface StoreGeneratorSchema extends GeneratorSchema {
  projectName: string;
  useContext?: boolean;
  useTypes?: boolean
  persist?: boolean;
}

export interface NormalizedStoreGeneratorSchema extends Normalized<WithNames<StoreGeneratorSchema>> {
  createMethod: string;
}

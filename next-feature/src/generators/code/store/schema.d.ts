import type { GeneratorSchema, Normalized, WithNames } from '../../../lib/types';

export interface StoreGeneratorSchema extends GeneratorSchema {
  name: string;
  useContext?: boolean;
  useTypes?: boolean
  persist?: boolean;
}

export interface NormalizedStoreGeneratorSchema extends Normalized<WithNames<StoreGeneratorSchema>> {
  createMethod: string;
  storeType: 'context' | 'zustand'
}

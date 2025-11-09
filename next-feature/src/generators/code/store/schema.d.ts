import { CodeGeneratorSchema, NormalizedCodeGeneratorSchema } from '../../../lib/types';

export interface StoreGeneratorSchema extends CodeGeneratorSchema {
  useContext?: boolean;
  useTypes?: boolean
  persist?: boolean;
}

export interface NormalizedStoreGeneratorSchema extends NormalizedCodeGeneratorSchema<StoreGeneratorSchema> {
  createMethod: string;
  storeType: 'context' | 'zustand'
}

/**
 * [normalize]
 * next-feature@0.1.0
 * November 9th 2025, 3:00:49 pm
 */
import { type NormalizedStoreGeneratorSchema, StoreGeneratorSchema } from '../../schema';
import { handleExportPath, normalizeCodeGenerator } from '../../../../../lib/utils/code-generator';
import { mutateNames, zustandCreateMethod } from '../options';

export function normalizeStoreGenerator(
  options: StoreGeneratorSchema
): NormalizedStoreGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  normalized.package ??= 'store';
  normalized.persist = Boolean(normalized.persist);
  normalized.useTypes = Boolean(normalized.useTypes);
  const mutatedNames = mutateNames(normalized);
  // const createMethod = zustandCreateMethod({ ...normalized, ...mutatedNames });
  const storeType = normalized.useContext ? 'context' : 'zustand';
  const exportPath = handleExportPath(normalized, storeType)
  normalized.outputFileName = mutatedNames.fileName;

  return {
    ...normalized,
    names: mutatedNames,
    // createMethod,
    storeType,
    exportPath
  };
}

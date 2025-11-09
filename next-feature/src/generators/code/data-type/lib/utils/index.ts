import {
  NormalizedUtilityGeneratorSchema,
  UtilityGeneratorSchema,
} from '../../../utility/schema';
import { normalizeCodeGenerator } from '../../../../../lib/utils/code-generator';
import {
  DataTypeGeneratorSchema,
  NormalizedDataTypeGeneratorSchema,
} from '../../schema';

/**
 * [normalize]
 * next-feature@0.0.12
 * November 9th 2025, 12:44:13 am
 */
export function normalize(
  options: DataTypeGeneratorSchema
): NormalizedDataTypeGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  return {
    ...normalized,
  };
}

/**
 * [data-type-content]
 * next-feature@0.0.12
 * November 9th 2025, 12:47:22 am
 */
export function dataTypeContent(options: NormalizedDataTypeGeneratorSchema) {
  return `
export interface ${options.names.className} {
}
`
}

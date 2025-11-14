import { handleExportPath, normalizeCodeGenerator } from '../../../../../lib/utils/code-generator';
import { ConstantGeneratorSchema, NormalizedConstantGeneratorSchema } from '../../schema';


/**
 * [normalize]
 * next-feature@0.0.12
 * November 9th 2025, 1:01:59 am
 */
export function normalize(options: ConstantGeneratorSchema) {
  const normalized = normalizeCodeGenerator(options);
  normalized.exportPath = handleExportPath(normalized, "constants");
  return {
    ...normalized,
  };
}

/**
 * [constant-content]
 * next-feature@0.0.12
 * November 9th 2025, 1:03:08 am
 */
export function constantContent(options: NormalizedConstantGeneratorSchema) {
  return `
export const ${options.names.constantName}: ${options.names.className} = null;
`;
}

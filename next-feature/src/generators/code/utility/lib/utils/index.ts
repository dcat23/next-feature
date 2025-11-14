import {
  NormalizedUtilityGeneratorSchema,
  UtilityGeneratorSchema,
} from '../../schema';
import {
  handleExportPath,
  normalizeCodeGenerator,
} from '../../../../../lib/utils/code-generator';

export function normalize(
  options: UtilityGeneratorSchema
): NormalizedUtilityGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  normalized.exportPath = handleExportPath(normalized, 'utils');

  return {
    ...normalized,
  };
}

export const utilsContent = (options: NormalizedUtilityGeneratorSchema) => (`
export function ${options.names.propertyName}(data: any) {

  return data;
}
`);

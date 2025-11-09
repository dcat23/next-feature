import {
  NormalizedUtilityGeneratorSchema,
  UtilityGeneratorSchema,
} from '../../schema';
import { normalizeCodeGenerator } from '../../../../../lib/utils/code-generator';

export function normalize(
  options: UtilityGeneratorSchema
): NormalizedUtilityGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  return {
    ...normalized
  };
}

export const utilsContent = (options: NormalizedUtilityGeneratorSchema) => (`
export function ${options.names.propertyName}(data: any) {

  return data;
}
`);

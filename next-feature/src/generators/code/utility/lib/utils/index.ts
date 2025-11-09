import { names } from '@nx/devkit';
import {
  NormalizedUtilityGeneratorSchema,
  UtilityGeneratorSchema,
} from '../../schema';
import { getOutputFileName } from '../../../../../lib/utils/code-generator';

export function normalize(
  options: UtilityGeneratorSchema
): NormalizedUtilityGeneratorSchema {
  const mutatedNames = names(options.name);
  options.package ??= 'lib';

  const outputFileName = getOutputFileName(options).concat('.ts');

  return {
    tmpl: '',
    ...options,
    names: mutatedNames,
    outputFileName,
  };
}

export const utilsContent = (options: NormalizedUtilityGeneratorSchema) => (`
export function ${options.names.propertyName}(data: any) {

  return data;
}
`);

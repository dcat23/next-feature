import {
  handleExportPath,
  normalizeCodeGenerator,
} from '../../../../../lib/utils/code-generator';
import {
  DeclarationGeneratorSchema,
  NormalizedDeclarationGeneratorSchema,
} from '../../schema';
import { DECLARATION_KINDS } from '../types';

export function normalize(
  options: DeclarationGeneratorSchema
): NormalizedDeclarationGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  normalized.exportPath = handleExportPath(
    normalized,
    DECLARATION_KINDS[options.kind].subDirectory
  );

  return {
    ...normalized,
  };
}
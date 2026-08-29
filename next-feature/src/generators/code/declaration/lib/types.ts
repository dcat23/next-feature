import type { NormalizedCodeGeneratorSchema } from '../../../../lib/types';
import type { DeclarationGeneratorSchema } from '../schema';

export type DeclarationKind = 'data-type' | 'utility' | 'constant';

export const DECLARATION_KINDS: Record<DeclarationKind, {
  subDirectory: string;
  content: (options: NormalizedCodeGeneratorSchema<DeclarationGeneratorSchema>) => string;
}> = {
  'data-type': {
    subDirectory: 'types',
    content: (options) => `
export interface ${options.names.className} {
}
`,
  },
  utility: {
    subDirectory: 'utils',
    content: (options) => `
export function ${options.names.propertyName}(data: any) {

  return data;
}
`,
  },
  constant: {
    subDirectory: 'constants',
    content: (options) => `
export const ${options.names.constantName}: ${options.names.className} = null;
`,
  },
};

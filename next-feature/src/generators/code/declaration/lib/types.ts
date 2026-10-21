import type { NormalizedCodeGeneratorSchema } from '../../../../lib/types';
import type { DeclarationGeneratorSchema } from '../schema';

export type DeclarationKind = 'data-type' | 'utility' | 'constant';

export const DECLARATION_KINDS: Record<DeclarationKind, {
  subDirectory: string;
  // client-safe declarations go to index, server-side helpers to server
  exportFile: 'index' | 'server';
  content: (options: NormalizedCodeGeneratorSchema<DeclarationGeneratorSchema>) => string;
}> = {
  'data-type': {
    subDirectory: 'types',
    exportFile: 'index',
    content: (options) => `
export interface ${options.names.className} {
}
`,
  },
  utility: {
    subDirectory: 'utils',
    exportFile: 'server',
    content: (options) => `
export function ${options.names.propertyName}(data: any) {

  return data;
}
`,
  },
  constant: {
    subDirectory: 'constants',
    exportFile: 'index',
    content: (options) => `
export const ${options.names.constantName}: ${options.names.className} = null;
`,
  },
};

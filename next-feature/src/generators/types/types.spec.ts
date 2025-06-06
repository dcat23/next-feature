import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { TypesGeneratorSchema } from './schema';

import { typesGenerator } from './types';

describe('types generator', () => {
  let tree: Tree;
  const options: TypesGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await typesGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'base');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await typesGenerator(tree, { ...options, name: 'backend-data' });
    const file = 'features/base/src/lib/types/index.ts';
    const buffer = tree.read(file);

    // logger.debug(tree.read(file, 'utf-8'))
    expect(tree.exists(file)).toBeTruthy();
    expect(buffer.includes('interface BackendData')).toBeTruthy();
  });
});

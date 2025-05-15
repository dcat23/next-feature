import { logger } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { storeGenerator } from './store';
import { StoreGeneratorSchema } from './schema';

describe('store generator', () => {
  let tree: Tree;
  const options: StoreGeneratorSchema = { name: 'test', projectName: "test", directory: "test" };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await storeGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await storeGenerator(tree, { ...options, useTypes: true });
    const file = 'test/src/lib/store/use-test-store.tsx';
    const types = 'test/src/lib/types/index.ts';

    expect(tree.exists(file)).toBeTruthy();
    expect(tree.exists(types)).toBeTruthy();
  });
});

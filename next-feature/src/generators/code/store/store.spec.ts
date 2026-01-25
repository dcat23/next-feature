import { logger } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { storeGenerator } from './store';
import { StoreGeneratorSchema } from './schema';

describe('store generator', () => {
  let tree: Tree;
  const options: StoreGeneratorSchema = { projectName: 'test', name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await storeGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'base');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await storeGenerator(tree, { ...options, useTypes: true });
    const file = 'features/base/src/lib/store/use-test-store.tsx';
    const types = 'features/base/src/lib/types/index.ts';

    expect(tree.exists(file)).toBeTruthy();
    expect(tree.exists(types)).toBeTruthy();
  });

  it('should generate context', async () => {
    await storeGenerator(tree, { ...options, useContext: true });
    const file = 'features/base/src/lib/store/use-test-context.tsx';
    const content = tree.read(file, 'utf-8')

    expect(tree.exists(file)).toBeTruthy();
    expect(content.includes("useTest()")).toBeTruthy();
  });
});

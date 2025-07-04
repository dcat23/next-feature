import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { constantGenerator } from './constant';
import { ConstantGeneratorSchema } from './schema';

describe('constant generator', () => {
  let tree: Tree;
  const options: ConstantGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await constantGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await constantGenerator(tree, options);
    const file = 'features/base/src/lib/constants/index.ts';
    const buffer = tree.read(file, "utf-8");

    // logger.debug(tree.read(file, 'utf-8'))
    expect(tree.exists(file)).toBeTruthy();
    expect(buffer.includes('const TEST = null')).toBeTruthy();
  });

  it('should generate in separate file', async () => {
    await constantGenerator(tree, { ...options, file: 'data' });
    const file = 'features/base/src/lib/constants/data.ts';
    const buffer = tree.read(file, "utf-8");

    // logger.debug(tree.read(file, 'utf-8'))
    expect(tree.exists(file)).toBeTruthy();
    expect(buffer.includes('const TEST = null')).toBeTruthy();
  });
});

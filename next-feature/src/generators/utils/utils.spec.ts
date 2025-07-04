import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { utilsGenerator } from './utils';
import { UtilsGeneratorSchema } from './schema';

describe('utils generator', () => {
  let tree: Tree;
  const options: UtilsGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await utilsGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'base');
    expect(config).toBeDefined();
  });


  it('should generate files', async () => {
    await utilsGenerator(tree, options);
    const file = 'features/base/src/lib/utils/index.ts';
    const buffer = tree.read(file, "utf-8");

    // logger.debug(tree.read(file, 'utf-8'))
    expect(tree.exists(file)).toBeTruthy();
    expect(buffer.includes('function test')).toBeTruthy();
  });


  it('should generate in separate file', async () => {
    await utilsGenerator(tree, { ...options, file: 'data' });
    const file = 'features/base/src/lib/utils/data.ts';
    const buffer = tree.read(file, "utf-8");

    // logger.debug(tree.read(file, 'utf-8'))
    expect(tree.exists(file)).toBeTruthy();
    expect(buffer.includes('function test')).toBeTruthy();
  });
});

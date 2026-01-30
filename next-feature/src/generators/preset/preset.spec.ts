import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, logger, readProjectConfiguration } from '@nx/devkit';
import { presetGenerator } from './preset';
import { PresetGeneratorSchema } from './schema';
describe('preset generator', () => {
  let tree: Tree;
  const options: PresetGeneratorSchema = {
    name: 'test',
  };
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });
  it('should run successfully', async () => {
    await presetGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
  it('debugging tree', async () => {
    await presetGenerator(tree, options);
    const targetPath = 'apps/test/src/lib/auth';
    logger.debug(tree.children(targetPath));
    const targetFile = tree.read(targetPath + '/index.ts', 'utf-8');
    logger.debug(targetFile);
  });
  it('should set import path', async () => {
    await presetGenerator(tree, options);
    const tsConfig = tree.read('tsconfig.base.json', 'utf-8');
    expect(tsConfig.includes('@app/test')).toBeTruthy();
    logger.debug(tsConfig);
  });
});

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import { utilityGenerator } from './utility';
import { UtilityGeneratorSchema } from './schema';
describe('utility generator', () => {
  let tree: Tree;
  const options: UtilityGeneratorSchema = { name: 'test' };
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });
  it('should run successfully', async () => {
    await utilityGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});

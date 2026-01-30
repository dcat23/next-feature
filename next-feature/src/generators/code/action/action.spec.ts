import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import { actionGenerator } from './action';
import { ActionGeneratorSchema } from './schema';
describe('action generator', () => {
  let tree: Tree;
  const options: ActionGeneratorSchema = { name: 'test' };
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });
  it('should run successfully', async () => {
    await actionGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});

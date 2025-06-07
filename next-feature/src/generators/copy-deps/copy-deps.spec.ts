import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { copyDepsGenerator } from './copy-deps';
import { CopyDepsGeneratorSchema } from './schema';

describe('copy-deps generator', () => {
  let tree: Tree;
  const options: CopyDepsGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await copyDepsGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});

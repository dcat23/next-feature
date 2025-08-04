import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, logger, readProjectConfiguration } from '@nx/devkit';

import { componentGenerator } from './component';
import { ComponentGeneratorSchema } from './schema';

describe('component generator', () => {
  let tree: Tree;
  const options: ComponentGeneratorSchema = { projectName: 'test-component' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await componentGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'base');
    expect(config).toBeDefined();
  });


  it('should generate files', async () => {
    await componentGenerator(tree, options);
    const file = 'features/base/src/components/test-component.tsx';

    expect(tree.exists(file)).toBeTruthy();
  });

});

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, logger, readProjectConfiguration } from '@nx/devkit';

import { componentGenerator } from './component';
import { ComponentGeneratorSchema } from './schema';

describe('component generator', () => {
  let tree: Tree;
  const options: ComponentGeneratorSchema = { name: 'test-component', directory: 'test', projectName: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await componentGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });


  it('should generate files', async () => {
    await componentGenerator(tree, options);
    const file = 'test/src/components/test-component.tsx';

    logger.debug(tree.children("test/src/components"))

    expect(tree.exists(file)).toBeTruthy();
  });

});

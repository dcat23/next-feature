import { addProjectConfiguration } from '@nx/devkit';
import { logger } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { typesGenerator } from './types';
import { TypesGeneratorSchema } from './schema';

describe('types generator', () => {
  let tree: Tree;
  const options: TypesGeneratorSchema = { name: 'test', projectName: 'features' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'features', {
      root: '.',
      sourceRoot: 'src',
    });
  });

  it('should run successfully', async () => {
    await typesGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'features');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await typesGenerator(tree, { ...options, name: 'backend-data' });
    const file = 'src/lib/types/index.ts';
    const buffer = tree.read(file)

    // logger.debug(tree.read(file, 'utf-8'))
    expect(tree.exists(file)).toBeTruthy();
    expect(buffer.includes('interface BackendData')).toBeTruthy();
  });

});

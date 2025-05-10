import { addProjectConfiguration } from '@nx/devkit';
import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { apiGenerator } from './api';
import { ApiGeneratorSchema } from './schema';

describe('api generator', () => {
  let tree: Tree;
  const options: ApiGeneratorSchema = { name: 'test', projectName: 'features' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'features', {
      root: '.',
      sourceRoot: 'src',
    });
  });

  it('should run successfully', async () => {
    await apiGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'features');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await apiGenerator(tree, { ...options, name: 'get-backend-data' });
    const file = 'src/lib/api/get-backend-data.ts';

    expect(tree.exists(file)).toBeTruthy();
  });

  it('should set directory', async () => {
    await apiGenerator(tree, {
      ...options,
      name: 'create-backend-data',
      package: 'features/test',
    });
    const file = 'src/features/test/api/create-backend-data.ts';

    expect(tree.exists(file)).toBeTruthy();
  });
});

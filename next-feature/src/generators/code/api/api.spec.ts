import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { apiGenerator } from './api';
import { ApiGeneratorSchema } from './schema';

describe('api generator', () => {
  let tree: Tree;
  const options: ApiGeneratorSchema = { projectName: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await apiGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'base');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await apiGenerator(tree, { ...options, projectName: 'get-backend-data' });
    const file = 'features/base/src/lib/api/get-backend-data.ts';

    expect(tree.exists(file)).toBeTruthy();
  });

  it('should set package', async () => {
    await apiGenerator(tree, {
      ...options,
      projectName: 'create-backend-data',
      package: 'test/nested/package',
    });
    const file =
      'features/base/src/test/nested/package/api/create-backend-data.ts';

    expect(tree.exists(file)).toBeTruthy();
  });

  it('should set directory', async () => {
    await apiGenerator(tree, {
      ...options,
      projectName: 'create-backend-data',
      directory: 'testing',
    });
    const file = 'testing/base/src/lib/api/create-backend-data.ts';

    expect(tree.exists(file)).toBeTruthy();
  });

  it('should create request body', async () => {
    await apiGenerator(tree, {
      ...options,
      projectName: 'create-backend-data',
      directory: 'testing',
    });
    const filePath = 'testing/base/src/lib/api/create-backend-data.ts';

    expect(tree.exists(filePath)).toBeTruthy();

    const file = tree.read(filePath, 'utf-8');

    expect(file.includes('CreateBackendDataRequest')).toBeTruthy();
  });

  it('should not create request body', async () => {
    await apiGenerator(tree, {
      ...options,
      projectName: 'get-backend-data',
      directory: 'testing',
    });
    const filePath = 'testing/base/src/lib/api/get-backend-data.ts';

    expect(tree.exists(filePath)).toBeTruthy();

    const file = tree.read(filePath, 'utf-8');

    expect(file.includes('GetBackendDataRequest')).toBeFalsy();
    expect(file.includes('GetBackendData')).toBeTruthy();
  });
});

import { logger, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { apiGenerator } from './api';
import { ApiGeneratorSchema } from './schema';

describe('api generator', () => {
  let tree: Tree;
  const options: ApiGeneratorSchema = { name: "test", projectName: "test" };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await apiGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await apiGenerator(tree, { ...options, name: 'get-backend-data' });
    const file = 'features/test/src/lib/api/get-backend-data.ts';

    expect(tree.exists(file)).toBeTruthy();
  });

  it('should set package', async () => {
    await apiGenerator(tree, {
      ...options,
      name: 'create-backend-data',
      package: 'test/nested/package',
    });
    const file =
      'features/test/src/test/nested/package/api/create-backend-data.ts';

    expect(tree.exists(file)).toBeTruthy();
  });

  it('should set directory', async () => {
    await apiGenerator(tree, {
      ...options,
      name: 'create-backend-data',
      directory: 'testing',
    });
    const file = 'testing/test/src/lib/api/create-backend-data.ts';
    logger.info(tree.children(""))
    expect(tree.exists(file)).toBeTruthy();
  });

  it('should create request body', async () => {
    await apiGenerator(tree, {
      ...options,
      name: 'create-backend-data',
      directory: 'testing',
    });
    const filePath = 'testing/test/src/lib/api/create-backend-data.ts';

    expect(tree.exists(filePath)).toBeTruthy();

    const file = tree.read(filePath, 'utf-8');

    expect(file.includes('CreateBackendDataRequest')).toBeTruthy();
  });

  it('should not create request body', async () => {
    await apiGenerator(tree, {
      ...options,
      name: 'get-backend-data',
      directory: 'testing',
    });
    const filePath = 'testing/test/src/lib/api/get-backend-data.ts';

    expect(tree.exists(filePath)).toBeTruthy();

    const file = tree.read(filePath, 'utf-8');

    expect(file.includes('GetBackendDataRequest')).toBeFalsy();
    expect(file.includes('GetBackendData')).toBeTruthy();
  });

  it('should set type imports from domain className', async () => {
    await apiGenerator(tree, {
      ...options,
      name: 'get-backend-data',
      directory: 'testing',
    });

    const apiFilePath = 'testing/test/src/lib/api/get-backend-data.ts';
    const typesFilePath = 'testing/test/src/lib/types/backend-data.ts';

    expect(tree.exists(typesFilePath)).toBeTruthy();

    const file = tree.read(apiFilePath, 'utf-8');

    expect(file.includes('../types/backend-data')).toBeTruthy();
  });
});

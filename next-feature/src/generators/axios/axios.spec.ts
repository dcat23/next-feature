import { readJson, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { axiosGenerator } from './axios';
import { AxiosGeneratorSchema } from './schema';

describe('axios generator', () => {
  let tree: Tree;
  const options: AxiosGeneratorSchema = {
    projectName: 'test',
    directory: 'apps'
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await axiosGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await axiosGenerator(tree, options);
    const files = tree.children('apps/test/src/lib/axios');
    expect(
      ['index.ts', 'error.ts', 'types.ts'].every((file) => files.includes(file))
    ).toBeTruthy();
  });
  it('should add dependencies to package.json', async () => {
    await axiosGenerator(tree, options);
    const packageJson = readJson(tree, 'package.json');
    const dependencies = Object.keys(packageJson['dependencies']);

    expect(['axios'].every((dep) => dependencies.includes(dep))).toBeTruthy();
  });
});

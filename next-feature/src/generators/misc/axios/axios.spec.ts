import { readJson, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { axiosGenerator } from './axios';
import { AxiosGeneratorSchema } from './schema';
describe('axios generator', () => {
  let tree: Tree;
  const options: AxiosGeneratorSchema = {
    projectName: 'test',
    directory: 'apps',
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
      ['index.ts', 'error.ts', 'schema.ts'].every((file) =>
        files.includes(file)
      )
    ).toBeTruthy();
  });
  it('should add dependencies to package.json', async () => {
    await axiosGenerator(tree, options);
    const packageJson = readJson(tree, 'package.json');
    const dependencies = Object.keys(packageJson['dependencies']);
    expect(['axios'].every((dep) => dependencies.includes(dep))).toBeTruthy();
  });
  it('should add properties to .env', async () => {
    await axiosGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    const dotenv = tree.read(path.join(config.root, '.env'), 'utf-8');
    expect(dotenv.includes('BASE_API_URL')).toBeTruthy();
  });
});

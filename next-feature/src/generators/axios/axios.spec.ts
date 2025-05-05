import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration, addProjectConfiguration, joinPathFragments, readJson } from '@nx/devkit';

import { axiosGenerator } from './axios';
import { AxiosGeneratorSchema } from './schema';

describe('axios generator', () => {
  let tree: Tree;
  const options: AxiosGeneratorSchema = {
    featureProject: 'test'
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'test', {
      root: ".",
      sourceRoot: "src",
      projectType: 'library'
    })
  });

  it('should run successfully', async () => {
    await axiosGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await axiosGenerator(tree, options);
    const files = tree.children("src/lib/axios")
    expect(
      ["index.ts", 'error.ts', 'types.ts'].every((file) =>
        files.includes(file))
    ).toBeTruthy();
  });
  it('should add dependencies to package.json', async () => {
    await axiosGenerator(tree, options);
    const packagejson = readJson(tree, "package.json")
    const dependencies = Object.keys(packagejson['dependencies']);

    expect(
      ["axios"].every((dep) =>
        (dependencies).includes(dep))
    ).toBeTruthy();
  });

});

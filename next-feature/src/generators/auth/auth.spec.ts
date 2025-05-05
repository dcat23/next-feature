import { logger } from '@nx/devkit';
import {
  addProjectConfiguration,
  readJson,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { authGenerator } from './auth';
import { AuthGeneratorSchema } from './schema';

describe('auth generator', () => {
  let tree: Tree;
  const options: AuthGeneratorSchema = {
    featureProject: 'test',
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'test', {
      root: '.',
      sourceRoot: 'src',
      projectType: 'library',
    });
  });

  it('should run successfully', async () => {
    await authGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await authGenerator(tree, options);
    const libDirectory = tree.children('src/lib/auth');
    const routeFile = 'src/app/api/auth/[...nextauth]/route.ts';

    expect(tree.exists(routeFile)).toBeTruthy()
    expect(
      ['index.ts', 'auth.config.ts', 'next-auth.d.ts'].every((file) =>
        libDirectory.includes(file)
      )
    ).toBeTruthy();
  });

  it('should add dependencies to package.json', async () => {
    await authGenerator(tree, options);
    const packagejson = readJson(tree, 'package.json');
    const dependencies = Object.keys(packagejson['dependencies']);

    expect(
      ['next-auth'].every((dep) => dependencies.includes(dep))
    ).toBeTruthy();
  });
});

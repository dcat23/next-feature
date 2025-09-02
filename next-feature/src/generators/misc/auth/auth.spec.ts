import { readJson, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { authGenerator } from './auth';
import { AuthGeneratorSchema } from './schema';

describe('auth generator', () => {
  let tree: Tree;
  const options: AuthGeneratorSchema = {
    projectName: 'test',
    directory: 'apps',
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await authGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should generate files', async () => {
    await authGenerator(tree, options);
    const libDirectory = tree.children('apps/test/src/lib/auth');
    const routeFile = 'apps/test/src/app/api/auth/[...nextauth]/route.ts';

    expect(tree.exists(routeFile)).toBeTruthy();
    expect(
      ['index.ts', 'auth.config.ts', 'next-auth.d.ts'].every((file) =>
        libDirectory.includes(file)
      )
    ).toBeTruthy();
  });

  it('should add dependencies to package.json', async () => {
    await authGenerator(tree, options);
    const packageJson = readJson(tree, 'package.json');
    const dependencies = Object.keys(packageJson['dependencies']);

    expect(
      ['next-auth'].every((dep) => dependencies.includes(dep))
    ).toBeTruthy();
  });

  it('should add environment variables', async () => {
    await authGenerator(tree, options);
    const dotenv = tree.read('apps/test/.env');
    expect(
      ['NEXTAUTH_URL', 'AUTH_SECRET'].every((dep) => dotenv.includes(dep))
    ).toBeTruthy();
  });
});

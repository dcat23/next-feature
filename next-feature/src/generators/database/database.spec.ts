import { logger } from '@nx/devkit';
import { readJson } from '@nx/devkit';
import { addProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { databaseGenerator } from './database';
import { DatabaseGeneratorSchema } from './schema';

describe('database generator', () => {
  let tree: Tree;
  const options: DatabaseGeneratorSchema = {
    projectName: 'test',
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
    await databaseGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });


  it('should generate files', async () => {
    await databaseGenerator(tree, options);
    const prisma = 'src/lib/prisma/index.ts';
    const composeFile = 'docker-compose.yml';

    expect(tree.exists(prisma)).toBeTruthy()
    expect(tree.exists(composeFile)).toBeTruthy();
  });

  it('should add dependencies to package.json', async () => {
    await databaseGenerator(tree, options);
    const packageJson = readJson(tree, 'package.json');
    const dependencies = Object.keys(packageJson['dependencies']);
    const devDependencies = Object.keys(packageJson['devDependencies']);

    expect(
      ['@prisma/client', '@auth/prisma-adapter']
        .every((dep) => dependencies.includes(dep))
    ).toBeTruthy();

    expect(
      ['prisma']
        .every((dep) => devDependencies.includes(dep))
    ).toBeTruthy();
  });


  it('should add environment variables', async () => {
    await databaseGenerator(tree, options);
    const dotenv = tree.read(".env")
    expect(
      ['DATABASE_USER',
        'DATABASE_HOST',
        'DATABASE_PASSWORD',
        'DATABASE_NAME',
        'DATABASE_PORT',
        'DATABASE_URL',
      ].every((dep) => dotenv.includes(dep))
    ).toBeTruthy();
  });
});

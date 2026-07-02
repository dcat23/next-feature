import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dotenvGenerator } from './dotenv';

jest.setTimeout(20000);

describe('dotenv generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  function root(name: string) {
    return readProjectConfiguration(tree, name).root;
  }

  function sourceRoot(name: string) {
    return readProjectConfiguration(tree, name).sourceRoot;
  }

  function envConfig(name: string) {
    return tree.read(`${sourceRoot(name)}/lib/config/env.ts`, 'utf-8');
  }

  it('auto-creates the target project and sets a variable in .env and .env.example', async () => {
    await dotenvGenerator(tree, {
      projectName: 'one',
      set: ['API_URL=http://localhost:8080'],
      skipFormat: true,
    });

    expect(tree.read(`${root('one')}/.env`, 'utf-8')).toContain(
      'API_URL=http://localhost:8080'
    );
    expect(tree.read(`${root('one')}/.env.example`, 'utf-8')).toContain(
      'API_URL=http://localhost:8080'
    );
  });

  it('removes a variable with unset', async () => {
    await dotenvGenerator(tree, {
      projectName: 'one',
      set: ['API_URL=http://localhost:8080'],
      skipFormat: true,
    });
    await dotenvGenerator(tree, {
      projectName: 'one',
      unset: ['API_URL'],
      skipFormat: true,
    });

    expect(tree.read(`${root('one')}/.env`, 'utf-8') ?? '').not.toMatch(
      /\bAPI_URL\b/
    );
  });

  it('syncs the same change across multiple projects', async () => {
    await dotenvGenerator(tree, { projectName: 'two', skipFormat: true });

    await dotenvGenerator(tree, {
      projectName: 'one',
      projects: ['two'],
      set: ['SHARED_URL=http://localhost:9090'],
      skipFormat: true,
    });

    expect(tree.read(`${root('one')}/.env`, 'utf-8')).toContain('SHARED_URL');
    expect(tree.read(`${root('two')}/.env`, 'utf-8')).toContain('SHARED_URL');
  });

  it('skips an unknown sync project instead of failing', async () => {
    await expect(
      dotenvGenerator(tree, {
        projectName: 'one',
        projects: ['does-not-exist'],
        set: ['API_URL=http://localhost:8080'],
        skipFormat: true,
      })
    ).resolves.not.toThrow();

    expect(tree.read(`${root('one')}/.env`, 'utf-8')).toContain('API_URL');
  });

  it('targets every existing .env* file when all is set', async () => {
    await dotenvGenerator(tree, { projectName: 'one', skipFormat: true });
    tree.write(`${root('one')}/.env.local`, '');
    tree.write(`${root('one')}/.env.prod`, '');

    await dotenvGenerator(tree, {
      projectName: 'one',
      set: ['API_URL=http://localhost:8080'],
      all: true,
      skipFormat: true,
    });

    expect(tree.read(`${root('one')}/.env.local`, 'utf-8')).toContain('API_URL');
    expect(tree.read(`${root('one')}/.env.prod`, 'utf-8')).toContain('API_URL');
  });

  it('adds new non-example env files to the root .gitignore without duplicating on rerun', async () => {
    await dotenvGenerator(tree, {
      projectName: 'one',
      files: ['local'],
      set: ['API_URL=http://localhost:8080'],
      skipFormat: true,
    });
    await dotenvGenerator(tree, {
      projectName: 'one',
      files: ['local'],
      set: ['API_URL=http://localhost:8080'],
      skipFormat: true,
    });

    const gitignore = tree.read('.gitignore', 'utf-8');
    expect(gitignore.match(/^\.env\.local$/gm)).toHaveLength(1);
    expect(gitignore).not.toContain('.env.example');
  });

  describe('skipEnvConfig option', () => {
    it('registers the variable in env.ts as z.string() by default', async () => {
      await dotenvGenerator(tree, {
        projectName: 'one',
        set: ['API_URL=http://localhost:8080'],
        skipFormat: true,
      });

      const text = envConfig('one');
      expect(text).toContain('API_URL: z.string(),');
      expect(text).toContain('export const API_URL = process.env.API_URL;');
    });

    it('does not touch env.ts when skipEnvConfig is true', async () => {
      await dotenvGenerator(tree, {
        projectName: 'one',
        set: ['API_URL=http://localhost:8080'],
        skipEnvConfig: true,
        skipFormat: true,
      });

      expect(envConfig('one')).not.toMatch(/\bAPI_URL\b/);
    });

    it('removes the schema entry and accessor on unset', async () => {
      await dotenvGenerator(tree, {
        projectName: 'one',
        set: ['API_URL=http://localhost:8080'],
        skipFormat: true,
      });
      await dotenvGenerator(tree, {
        projectName: 'one',
        unset: ['API_URL'],
        skipFormat: true,
      });

      expect(envConfig('one')).not.toMatch(/\bAPI_URL\b/);
    });
  });
});

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson, Tree, writeJson } from '@nx/devkit';
import { updateDependencies } from './index';

describe('updateDependencies', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    writeJson(tree, 'package.json', { name: 'root', dependencies: { zod: '^3.20.0' } });
    writeJson(tree, 'features/users/package.json', { name: '@feature/users' });
  });

  it('adds dependencies to the workspace package.json by default', () => {
    updateDependencies(tree, { sonner: '^2.0.0' }, { prettier: '^3.0.0' });
    const json = readJson(tree, 'package.json');
    expect(json.dependencies.sonner).toBe('^2.0.0');
    expect(json.devDependencies.prettier).toBe('^3.0.0');
  });

  it('resolves projectRoot to <projectRoot>/package.json (#28)', () => {
    updateDependencies(tree, { zod: '^3.24.4' }, {}, { projectRoot: 'features/users' });
    expect(readJson(tree, 'features/users/package.json').dependencies.zod).toBe('^3.24.4');
    expect(readJson(tree, 'package.json').dependencies.zod).toBe('^3.20.0');
  });

  it('still accepts a project root string', () => {
    updateDependencies(tree, { zod: '^3.24.4' }, {}, 'features/users');
    expect(readJson(tree, 'features/users/package.json').dependencies.zod).toBe('^3.24.4');
  });

  it('throws a clear error when the package.json is missing', () => {
    expect(() => updateDependencies(tree, { zod: '^3.24.4' }, {}, { projectRoot: 'features/nope' })).toThrow(
      'features/nope/package.json does not exist'
    );
  });

  it('keeps an installed version by default', () => {
    updateDependencies(tree, { zod: '^3.24.4' }, {});
    expect(readJson(tree, 'package.json').dependencies.zod).toBe('^3.20.0');
  });

  it('raises an installed version with updateExistingVersions', () => {
    updateDependencies(tree, { zod: '^3.24.4' }, {}, { updateExistingVersions: true });
    expect(readJson(tree, 'package.json').dependencies.zod).toBe('^3.24.4');
  });

  it('never lowers an installed version', () => {
    updateDependencies(tree, { zod: '^3.10.0' }, {}, { updateExistingVersions: true });
    expect(readJson(tree, 'package.json').dependencies.zod).toBe('^3.20.0');
  });
});

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson, readNxJson, Tree } from '@nx/devkit';
import { initGenerator } from './init';
import { PLUGIN_NAME, PLUGIN_VERSION } from '../../lib/constants/versions';

describe('init generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('adds the libraries as dependencies and the plugin as a dev dependency', async () => {
    await initGenerator(tree);
    const packageJson = readJson(tree, 'package.json');
    expect(packageJson.dependencies['@next-feature/client']).toBe(PLUGIN_VERSION);
    expect(packageJson.dependencies['@next-feature/logging']).toBe(PLUGIN_VERSION);
    expect(packageJson.devDependencies[PLUGIN_NAME]).toBe(PLUGIN_VERSION);
    expect(packageJson.dependencies[PLUGIN_NAME]).toBeUndefined();
  });

  it('moves the plugin from dependencies to devDependencies', async () => {
    const packageJson = readJson(tree, 'package.json');
    tree.write('package.json', JSON.stringify({ ...packageJson, dependencies: { [PLUGIN_NAME]: PLUGIN_VERSION } }));
    await initGenerator(tree);
    expect(readJson(tree, 'package.json').dependencies[PLUGIN_NAME]).toBeUndefined();
  });

  it('ensures nx.json has a generators section', async () => {
    await initGenerator(tree);
    expect(readNxJson(tree)?.generators).toBeDefined();
  });
});

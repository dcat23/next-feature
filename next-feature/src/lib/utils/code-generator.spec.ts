import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { addProjectConfiguration, Tree } from '@nx/devkit';
import { initializeCodeGenerator, resolveProjectType } from './code-generator';

describe('initializeCodeGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should return library projectType for an auto-created feature', async () => {
    const { projectType } = await initializeCodeGenerator(
      tree,
      { name: 'getUser', projectName: 'test' },
      'action'
    );
    expect(projectType).toBe('library');
  });

  it('should return application projectType for an application', async () => {
    addProjectConfiguration(tree, 'web', {
      root: 'apps/web',
      sourceRoot: 'apps/web/src',
      projectType: 'application',
    });
    const { projectType } = await initializeCodeGenerator(
      tree,
      { name: 'getUser', projectName: 'web' },
      'action'
    );
    expect(projectType).toBe('application');
  });
});

describe('resolveProjectType', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should detect an application by next.config when projectType is missing', () => {
    tree.write('apps/web/next.config.js', '');
    expect(resolveProjectType(tree, { root: 'apps/web' })).toBe('application');
  });

  it('should default to library when projectType is missing and there is no next.config', () => {
    expect(resolveProjectType(tree, { root: 'features/test' })).toBe('library');
  });
});

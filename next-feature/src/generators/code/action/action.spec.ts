import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import { actionGenerator } from './action';
import { ActionGeneratorSchema } from './schema';
describe('action generator', () => {
  let tree: Tree;
  const options: ActionGeneratorSchema = {
    name: 'test',
    actionType: 'api',
    projectName: 'test',
  };
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });
  it('should run successfully', async () => {
    await actionGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should chain the hook generator when useHook is set', async () => {
    await actionGenerator(tree, {
      name: 'getUsers',
      actionType: 'api',
      projectName: 'base',
      useHook: true,
    });
    const hookFile = 'features/base/src/hooks/use-get-users.ts';
    const buffer = tree.read(hookFile, 'utf-8') ?? '';
    expect(tree.exists(hookFile)).toBeTruthy();
    expect(buffer.includes('useQuery')).toBeTruthy();
    expect(buffer.includes(`from '../lib/actions/user'`)).toBeTruthy();
  });

  it('should not chain the hook generator for form actions', async () => {
    await actionGenerator(tree, {
      name: 'submitFeedback',
      actionType: 'form',
      projectName: 'base',
      useHook: true,
    });
    const hookFile = 'features/base/src/hooks/use-submit-feedback.ts';
    expect(tree.exists(hookFile)).toBeFalsy();
  });
});

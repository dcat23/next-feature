import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import { hookGenerator } from './hook';
import { HookGeneratorSchema } from './schema';

describe('hook generator', () => {
  let tree: Tree;
  const options: HookGeneratorSchema = { projectName: 'test', name: 'getUsers' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await hookGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should generate a useQuery hook for a GET-prefixed name', async () => {
    await hookGenerator(tree, options);
    const file = 'features/test/src/hooks/use-get-users.ts';
    const buffer = tree.read(file, 'utf-8') ?? '';
    expect(tree.exists(file)).toBeTruthy();
    expect(buffer.includes('useQuery')).toBeTruthy();
    expect(buffer.includes('export function useGetUsers')).toBeTruthy();
    expect(buffer.includes(`from '../lib/actions/user'`)).toBeTruthy();
  });

  it('should generate a useMutation hook for a non-GET-prefixed name', async () => {
    await hookGenerator(tree, { ...options, name: 'createUser' });
    const file = 'features/test/src/hooks/use-create-user.ts';
    const buffer = tree.read(file, 'utf-8') ?? '';
    expect(tree.exists(file)).toBeTruthy();
    expect(buffer.includes('useMutation')).toBeTruthy();
    expect(buffer.includes('export function useCreateUser')).toBeTruthy();
  });

  it('should export the hook from the project index', async () => {
    await hookGenerator(tree, { ...options, export: true });
    const index = 'features/test/src/index.ts';
    const buffer = tree.read(index, 'utf-8') ?? '';
    expect(buffer.includes("export * from './hooks/use-get-users';")).toBeTruthy();
  });

  it('should respect a custom actionPackage and actionFile', async () => {
    await hookGenerator(tree, {
      ...options,
      actionPackage: 'lib/api',
      actionFile: 'users',
    });
    const file = 'features/test/src/hooks/use-get-users.ts';
    const buffer = tree.read(file, 'utf-8') ?? '';
    expect(buffer.includes(`from '../lib/api/users'`)).toBeTruthy();
  });
});
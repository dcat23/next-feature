import type { ExecutorContext } from '@nx/devkit';
import { spawnSync } from 'child_process';
import runExecutor from './executor';

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}));

describe('shadcn executor', () => {
  const mockedSpawnSync = spawnSync as jest.Mock;

  const context: ExecutorContext = {
    root: '/workspace',
    cwd: '/workspace',
    isVerbose: false,
    projectName: 'ui',
    projectsConfigurations: {
      version: 2,
      projects: {
        ui: { root: 'features/ui' },
      },
    },
    nxJsonConfiguration: {},
    projectGraph: undefined,
  } as unknown as ExecutorContext;

  beforeEach(() => {
    mockedSpawnSync.mockReset();
    mockedSpawnSync.mockReturnValue({ status: 0 });
  });

  it('runs npx shadcn@latest with the given args in the project root', async () => {
    const result = await runExecutor({ args: 'add button' }, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      ['shadcn@latest', 'add', 'button'],
      expect.objectContaining({ cwd: '/workspace/features/ui' })
    );
    expect(result.success).toBe(true);
  });

  it('defaults to "add" when no args are given', async () => {
    await runExecutor({}, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      ['shadcn@latest', 'add'],
      expect.anything()
    );
  });

  it('reports failure when the process exits non-zero', async () => {
    mockedSpawnSync.mockReturnValue({ status: 1 });

    const result = await runExecutor({ args: 'add button' }, context);

    expect(result.success).toBe(false);
  });
});

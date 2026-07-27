import type { ExecutorContext } from '@nx/devkit';
import { spawnSync } from 'child_process';
import runExecutor from './executor';
import { syncShadcnDependencies } from '../../lib/utils/shadcn';

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  spawnSync: jest.fn(),
}));

jest.mock('../../lib/utils/shadcn', () => ({
  ...jest.requireActual('../../lib/utils/shadcn'),
  syncShadcnDependencies: jest.fn(),
}));

describe('shadcn executor', () => {
  const mockedSpawnSync = spawnSync as jest.Mock;
  const mockedSyncShadcnDependencies = syncShadcnDependencies as jest.Mock;

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
    mockedSyncShadcnDependencies.mockReset();
  });

  it('runs npx shadcn@latest with the given args in the project root, then syncs dependencies to the root', async () => {
    const result = await runExecutor({ args: 'add button' }, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      ['shadcn@latest', 'add', 'button'],
      expect.objectContaining({ cwd: '/workspace/features/ui' })
    );
    expect(result.success).toBe(true);
    expect(mockedSyncShadcnDependencies).toHaveBeenCalledWith('/workspace', 'features/ui');
  });

  it('defaults to "add" when no args are given', async () => {
    await runExecutor({}, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      ['shadcn@latest', 'add'],
      expect.anything()
    );
  });

  it('reports failure when the process exits non-zero, and does not sync dependencies', async () => {
    mockedSpawnSync.mockReturnValue({ status: 1 });

    const result = await runExecutor({ args: 'add button' }, context);

    expect(result.success).toBe(false);
    expect(mockedSyncShadcnDependencies).not.toHaveBeenCalled();
  });
});

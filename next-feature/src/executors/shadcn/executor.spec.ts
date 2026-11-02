import type { ExecutorContext } from '@nx/devkit';
import { spawnSync } from 'child_process';
import runExecutor from './executor';
import { ensureShadcnBase, SHADCN_CLI, syncShadcnDependencies } from '../../lib/utils/shadcn';

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  spawnSync: jest.fn(),
}));

jest.mock('../../lib/utils/shadcn', () => ({
  ...jest.requireActual('../../lib/utils/shadcn'),
  syncShadcnDependencies: jest.fn(),
  ensureShadcnBase: jest.fn(),
}));

describe('shadcn executor', () => {
  const mockedSpawnSync = spawnSync as jest.Mock;
  const mockedSyncShadcnDependencies = syncShadcnDependencies as jest.Mock;
  const mockedEnsureShadcnBase = ensureShadcnBase as jest.Mock;

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
    mockedEnsureShadcnBase.mockReset();
    mockedEnsureShadcnBase.mockReturnValue({ success: true });
  });

  describe('style base', () => {
    it('installs the style base before adding components', async () => {
      await runExecutor({ args: 'button' }, context);

      expect(mockedEnsureShadcnBase).toHaveBeenCalledWith('/workspace/features/ui');
      expect(mockedEnsureShadcnBase.mock.invocationCallOrder[0]).toBeLessThan(mockedSpawnSync.mock.invocationCallOrder[0]);
    });

    it('installs it for legacy "add ..." args too', async () => {
      await runExecutor({ args: 'add button' }, context);
      expect(mockedEnsureShadcnBase).toHaveBeenCalled();
    });

    it('fails without adding when the base can\'t be installed', async () => {
      mockedEnsureShadcnBase.mockReturnValue({ success: false });

      const result = await runExecutor({ args: 'button' }, context);

      expect(result.success).toBe(false);
      expect(mockedSpawnSync).not.toHaveBeenCalled();
    });

    it('does not check the base for other commands', async () => {
      await runExecutor({ args: 'diff' }, context);
      expect(mockedEnsureShadcnBase).not.toHaveBeenCalled();
    });

    it('maps the init action to adding the style base, keeping components.json', async () => {
      const result = await runExecutor({ action: 'init' }, context);

      expect(result.success).toBe(true);
      expect(mockedSpawnSync).toHaveBeenCalledWith(
        'npx',
        [SHADCN_CLI, 'add', 'index', '--yes'],
        expect.objectContaining({ cwd: '/workspace/features/ui' })
      );
      expect(mockedSyncShadcnDependencies).toHaveBeenCalledWith('/workspace', 'features/ui');
    });

    it('rejects a preset with the init action, pointing at apply', async () => {
      const result = await runExecutor({ action: 'init', preset: 'nova' }, context);

      expect(result.success).toBe(false);
      expect(mockedSpawnSync).not.toHaveBeenCalled();
    });

    it('still passes a real init through as legacy args', async () => {
      await runExecutor({ args: 'init --force' }, context);

      expect(mockedSpawnSync).toHaveBeenCalledWith('npx', [SHADCN_CLI, 'init', '--force'], expect.anything());
      expect(mockedEnsureShadcnBase).not.toHaveBeenCalled();
    });
  });

  it('runs the shadcn CLI with the given args in the project root, then syncs dependencies to the root', async () => {
    const result = await runExecutor({ args: 'add button' }, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'add', 'button'],
      expect.objectContaining({ cwd: '/workspace/features/ui' })
    );
    expect(result.success).toBe(true);
    expect(mockedSyncShadcnDependencies).toHaveBeenCalledWith('/workspace', 'features/ui');
  });

  it('defaults to "add" when no args are given', async () => {
    await runExecutor({}, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'add'],
      expect.anything()
    );
  });

  it('reports failure when the process exits non-zero, and does not sync dependencies', async () => {
    mockedSpawnSync.mockReturnValue({ status: 1 });

    const result = await runExecutor({ args: 'add button' }, context);

    expect(result.success).toBe(false);
    expect(mockedSyncShadcnDependencies).not.toHaveBeenCalled();
  });

  it('passes args after the action', async () => {
    await runExecutor({ action: 'add', args: 'button card' }, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'add', 'button', 'card'],
      expect.anything()
    );
  });

  it('defaults the action to "add" when args has no command', async () => {
    await runExecutor({ args: 'button' }, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'add', 'button'],
      expect.anything()
    );
  });

  it('passes legacy args that start with a shadcn command through unchanged', async () => {
    await runExecutor({ args: 'diff' }, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'diff'],
      expect.anything()
    );
  });

  it('appends --preset to the apply action', async () => {
    await runExecutor({ action: 'apply', preset: 'nova', args: '--yes' }, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'apply', '--preset=nova', '--yes'],
      expect.anything()
    );
  });

  it('omits --preset when preset is empty', async () => {
    await runExecutor({ action: 'apply', preset: '' }, context);

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'apply'],
      expect.anything()
    );
  });

  it('fails without running the CLI when preset is given with the add action', async () => {
    const result = await runExecutor({ action: 'add', preset: 'nova' }, context);

    expect(result.success).toBe(false);
    expect(mockedSpawnSync).not.toHaveBeenCalled();
  });

  it('fails without running the CLI when preset is given with a legacy command in args', async () => {
    const result = await runExecutor({ args: 'add button', preset: 'nova' }, context);

    expect(result.success).toBe(false);
    expect(mockedSpawnSync).not.toHaveBeenCalled();
  });
});

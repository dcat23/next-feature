import { spawnSync } from 'child_process';
import { runShadcnCli } from './shadcn';

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}));

describe('runShadcnCli', () => {
  const mockedSpawnSync = spawnSync as jest.Mock;

  beforeEach(() => {
    mockedSpawnSync.mockReset();
    mockedSpawnSync.mockReturnValue({ status: 0 });
  });

  it('runs npx shadcn@latest with the parsed args in the given cwd', () => {
    const result = runShadcnCli('/workspace/features/ui', 'add button');

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      ['shadcn@latest', 'add', 'button'],
      expect.objectContaining({ cwd: '/workspace/features/ui' })
    );
    expect(result.success).toBe(true);
  });

  it('filters out extra whitespace between args', () => {
    runShadcnCli('/workspace/features/ui', 'add  button   card');

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      ['shadcn@latest', 'add', 'button', 'card'],
      expect.anything()
    );
  });

  it('reports failure when the process exits non-zero', () => {
    mockedSpawnSync.mockReturnValue({ status: 1 });

    const result = runShadcnCli('/workspace/features/ui', 'add button');

    expect(result.success).toBe(false);
  });
});

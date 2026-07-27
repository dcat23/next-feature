import { detectPackageManager, getPackageManagerCommand } from '@nx/devkit';
import { execSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { runShadcnCli, syncShadcnDependencies } from './shadcn';

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  detectPackageManager: jest.fn(),
  getPackageManagerCommand: jest.fn(),
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

describe('syncShadcnDependencies', () => {
  const mockedReadFileSync = readFileSync as jest.Mock;
  const mockedWriteFileSync = writeFileSync as jest.Mock;
  const mockedExecSync = execSync as jest.Mock;
  const mockedDetectPackageManager = detectPackageManager as jest.Mock;
  const mockedGetPackageManagerCommand = getPackageManagerCommand as jest.Mock;

  const workspaceRoot = '/workspace';
  const projectRoot = 'features/ui';

  beforeEach(() => {
    mockedReadFileSync.mockReset();
    mockedWriteFileSync.mockReset();
    mockedExecSync.mockReset();
    mockedDetectPackageManager.mockReset().mockReturnValue('pnpm');
    mockedGetPackageManagerCommand.mockReset().mockReturnValue({ install: 'pnpm install' });
  });

  function mockPackageJsons(projectPkgJson: object, rootPkgJson: object) {
    mockedReadFileSync.mockImplementation((filePath: string) =>
      filePath === '/workspace/features/ui/package.json'
        ? JSON.stringify(projectPkgJson)
        : JSON.stringify(rootPkgJson)
    );
  }

  it('mirrors a dependency the root package.json is missing, and reinstalls at the root', () => {
    mockPackageJsons(
      { dependencies: { 'class-variance-authority': '^0.7.1' } },
      { dependencies: {} }
    );

    syncShadcnDependencies(workspaceRoot, projectRoot);

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      '/workspace/package.json',
      expect.stringContaining('"class-variance-authority": "^0.7.1"')
    );
    expect(mockedExecSync).toHaveBeenCalledWith('pnpm install', expect.objectContaining({ cwd: workspaceRoot }));
  });

  it('does not overwrite a version already pinned at the root', () => {
    mockPackageJsons(
      { dependencies: { zod: '^4.0.0' } },
      { dependencies: { zod: '^3.24.1' } }
    );

    syncShadcnDependencies(workspaceRoot, projectRoot);

    expect(mockedWriteFileSync).not.toHaveBeenCalled();
    expect(mockedExecSync).not.toHaveBeenCalled();
  });

  it('does nothing when there are no new dependencies to mirror', () => {
    mockPackageJsons(
      { dependencies: { clsx: '^2.1.1' } },
      { dependencies: { clsx: '^2.1.1' } }
    );

    syncShadcnDependencies(workspaceRoot, projectRoot);

    expect(mockedWriteFileSync).not.toHaveBeenCalled();
    expect(mockedExecSync).not.toHaveBeenCalled();
  });

  it('mirrors new devDependencies too', () => {
    mockPackageJsons(
      { devDependencies: { 'tw-animate-css': '^1.3.0' } },
      { dependencies: {} }
    );

    syncShadcnDependencies(workspaceRoot, projectRoot);

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      '/workspace/package.json',
      expect.stringContaining('"tw-animate-css": "^1.3.0"')
    );
  });
});

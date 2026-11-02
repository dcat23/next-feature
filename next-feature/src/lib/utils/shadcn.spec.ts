import { detectPackageManager, getPackageManagerCommand } from '@nx/devkit';
import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import {
  ensureShadcnBase,
  installShadcnBaseTask,
  isShadcnBaseInstalled,
  runShadcnCli,
  SHADCN_CLI,
  syncShadcnDependencies,
} from './shadcn';
import { externalizeDeclaredDependenciesOnDisk } from './vite-config';

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  detectPackageManager: jest.fn(),
  getPackageManagerCommand: jest.fn(),
  logger: { info: jest.fn(), warn: jest.fn() },
}));

jest.mock('./vite-config', () => ({
  externalizeDeclaredDependenciesOnDisk: jest.fn(),
}));

describe('runShadcnCli', () => {
  const mockedSpawnSync = spawnSync as jest.Mock;

  beforeEach(() => {
    mockedSpawnSync.mockReset();
    mockedSpawnSync.mockReturnValue({ status: 0 });
  });

  it('runs the pinned shadcn CLI version with the parsed args in the given cwd', () => {
    expect(SHADCN_CLI).toBe('shadcn@4.23.0');

    const result = runShadcnCli('/workspace/features/ui', 'add button');

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'add', 'button'],
      expect.objectContaining({ cwd: '/workspace/features/ui' })
    );
    expect(result.success).toBe(true);
  });

  it('filters out extra whitespace between args', () => {
    runShadcnCli('/workspace/features/ui', 'add  button   card');

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      'npx',
      [SHADCN_CLI, 'add', 'button', 'card'],
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
    (externalizeDeclaredDependenciesOnDisk as jest.Mock).mockReset().mockReturnValue(false);
  });

  it('converts the project\'s vite config to externalize its declared dependencies', () => {
    mockPackageJsons({ dependencies: {} }, { dependencies: {} });

    syncShadcnDependencies(workspaceRoot, projectRoot);

    expect(externalizeDeclaredDependenciesOnDisk).toHaveBeenCalledWith(workspaceRoot, projectRoot);
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

describe('style base', () => {
  const mockedSpawnSync = spawnSync as jest.Mock;
  const mockedExistsSync = existsSync as jest.Mock;
  const mockedReadFileSync = readFileSync as jest.Mock;
  const projectDir = '/workspace/apps/web';

  /** components.json pointing at app/global.css (null = no components.json), with the given CSS (undefined = missing file) */
  function givenProject(css: string | undefined, componentsJson: object | null = { tailwind: { css: 'app/global.css' } }) {
    mockedExistsSync.mockImplementation((p: string) =>
      p.endsWith('components.json') ? componentsJson !== null : p.endsWith('global.css') && css !== undefined
    );
    mockedReadFileSync.mockImplementation((p: string) =>
      p.endsWith('components.json') ? JSON.stringify(componentsJson) : css
    );
  }

  beforeEach(() => {
    mockedSpawnSync.mockReset();
    mockedSpawnSync.mockReturnValue({ status: 0 });
    mockedExistsSync.mockReset();
    mockedReadFileSync.mockReset();
  });

  describe('isShadcnBaseInstalled', () => {
    it('is false while the Tailwind CSS file only imports tailwindcss', () => {
      givenProject("@import 'tailwindcss';\n@source \"../../../features\";");
      expect(isShadcnBaseInstalled(projectDir)).toBe(false);
    });

    it.each(['@import "shadcn/tailwind.css";', '@import "tw-animate-css";'])('is true once the CSS has %s', (line) => {
      givenProject(`@import 'tailwindcss';\n${line}`);
      expect(isShadcnBaseInstalled(projectDir)).toBe(true);
    });

    it('is false when the CSS file is missing', () => {
      givenProject(undefined);
      expect(isShadcnBaseInstalled(projectDir)).toBe(false);
    });

    it('treats projects without components.json as having nothing to install', () => {
      givenProject("@import 'tailwindcss';", null);
      expect(isShadcnBaseInstalled(projectDir)).toBe(true);
    });
  });

  describe('ensureShadcnBase', () => {
    it('runs shadcn add index --yes when the base is missing', () => {
      givenProject("@import 'tailwindcss';");
      expect(ensureShadcnBase(projectDir)).toEqual({ success: true });
      expect(mockedSpawnSync).toHaveBeenCalledWith(
        'npx',
        [SHADCN_CLI, 'add', 'index', '--yes'],
        expect.objectContaining({ cwd: projectDir })
      );
    });

    it('does nothing when the base is installed', () => {
      givenProject('@import "shadcn/tailwind.css";');
      expect(ensureShadcnBase(projectDir)).toEqual({ success: true });
      expect(mockedSpawnSync).not.toHaveBeenCalled();
    });

    it('never runs shadcn init, which would rewrite components.json', () => {
      givenProject("@import 'tailwindcss';");
      ensureShadcnBase(projectDir);
      expect(mockedSpawnSync.mock.calls[0][1]).not.toContain('init');
    });
  });

  describe('installShadcnBaseTask', () => {
    const mockedReadForSync = readFileSync as jest.Mock;

    it('only warns when the base install fails (e.g. offline)', async () => {
      const { logger } = jest.requireMock('@nx/devkit');
      givenProject("@import 'tailwindcss';");
      mockedSpawnSync.mockReturnValue({ status: 1 });

      expect(() => installShadcnBaseTask('/workspace', 'apps/web', 'web')()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('npx nx run web:shadcn --action=init'));
      expect(mockedReadForSync).not.toHaveBeenCalledWith(expect.stringContaining('package.json'), 'utf-8');
    });
  });
});

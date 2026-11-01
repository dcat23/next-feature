import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
// pnpm 11 fails installs on unapproved dependency build scripts (e.g. nx's
// postinstall), which the generated test workspace doesn't approve
process.env.pnpm_config_strict_dep_builds = 'false';
// pnpm 11 only installs versions published more than a day ago by default
// (minimum-release-age: 1440 minutes) and otherwise falls back to an older
// one, so the just-published 0.0.0-e2e packages would be replaced by an old
// npm release
process.env.pnpm_config_minimum_release_age = '0';
// The local registry reuses one address across runs, so pnpm's metadata cache
// for it goes stale (it re-publishes 0.0.0-e2e each run, and proxied packages
// age), and pnpm trusts the cache. Use a fresh cache per run; the package
// store is separate, so tarballs are still reused.
const pnpmCacheDir = join(process.cwd(), 'tmp', 'e2e-pnpm-cache');
rmSync(pnpmCacheDir, { recursive: true, force: true });
process.env.pnpm_config_cache_dir = pnpmCacheDir;

// Generating, installing and building in the test workspace is slow
const SLOW = 10 * 60 * 1000;

describe('next-feature', () => {
  let projectDirectory: string;

  /** Runs a command in the test workspace; throws (with its output) on failure. */
  const run = (command: string) =>
    execSync(command, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });

  /** Runs a command that must fail, returning its combined output. */
  const runFailing = (command: string): string => {
    try {
      execSync(command, { cwd: projectDirectory, stdio: 'pipe', env: process.env });
    } catch (error) {
      const { stdout, stderr } = error as { stdout: Buffer; stderr: Buffer };
      return `${stdout}${stderr}`;
    }
    throw new Error(`Expected "${command}" to fail`);
  };

  const read = (path: string) => readFileSync(join(projectDirectory, path), 'utf-8');
  const readJson = (path: string) => JSON.parse(read(path));

  beforeAll(() => {
    projectDirectory = createTestProject();
    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`pnpm add -D next-feature@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });
  afterAll(() => {
    // E2E_KEEP=1 keeps the workspace for debugging a failed run
    if (projectDirectory && !process.env.E2E_KEEP) {
      // Cleanup the test project
      rmSync(projectDirectory, {
        recursive: true,
        force: true,
      });
    }
  });
  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('pnpm ls --depth 100 next-feature', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
    // the build from this repo, not a published release
    expect(readJson('node_modules/next-feature/package.json').version).toBe('0.0.0-e2e');
  });

  describe('code generators', () => {
    it('should require projectName instead of falling back to a base project', () => {
      const output = runFailing('pnpm exec nx g next-feature:client-config --no-interactive');
      expect(output).toContain("Required property 'projectName' is missing");
      expect(existsSync(join(projectDirectory, 'features/base'))).toBe(false);
    });

    it('should reject the removed base feature type', () => {
      const output = runFailing('pnpm exec nx g next-feature:feature demo --type=base --no-interactive');
      expect(output).toContain("'base' should be one of");
    });

    it('should reject the removed db action type', () => {
      const output = runFailing('pnpm exec nx g next-feature:action getUsers -p users --actionType=db --no-interactive');
      expect(output).toContain("'db' should be one of");
    });

    it(
      'should generate an api action with a hook into a new feature that builds',
      () => {
        run('pnpm exec nx g next-feature:action getUsers -p users --useHook --no-interactive');

        // server-only action, client-safe contract, 'use server' wrapper
        expect(read('features/users/src/lib/actions/user.ts')).toMatch(/^import 'server-only';/);
        expect(read('features/users/src/lib/actions/user.ts')).toContain("from '@next-feature/client/server'");
        expect(read('features/users/src/lib/actions/user.action.ts')).toMatch(/^'use server';/);
        expect(existsSync(join(projectDirectory, 'features/users/src/lib/types/user.ts'))).toBe(true);
        // client config imports ApiClient from the server entry
        const config = read('features/users/src/lib/config/client.ts');
        expect(config).toMatch(/^import 'server-only';/);
        expect(config).toContain("import { ApiClient } from '@next-feature/client/server';");
        expect(read('features/users/src/server.ts')).toMatch(/^import 'server-only';/);

        run('pnpm exec nx build users');

        // @next-feature/client is declared in the feature, so the build keeps
        // it external instead of bundling it (and axios) into dist/
        expect(readJson('features/users/package.json').dependencies['@next-feature/client']).toBe('^0.0.0-e2e');
        expect(bareImports(join(projectDirectory, 'dist/features/users'))).toContain('@next-feature/client/server');
      },
      SLOW
    );
  });

  describe('ui feature', () => {
    // Skipped until #35: `shadcn add` without `init` installs the unrelated
    // `cn` package and not the component's dependencies, and `init` prompts to
    // overwrite the generated components.json, so neither runs in CI
    it.skip(
      'should keep the packages shadcn installs external and declared',
      () => {
        run('pnpm exec nx g next-feature:feature ui --type=ui --no-interactive');
        expect(read('features/ui/vite.config.mts')).toContain('external: isExternal');

        run('pnpm exec nx run ui:shadcn --args="button --yes"');
        run('pnpm exec nx build ui');

        const declared = (() => {
          const pkg = readJson('features/ui/package.json');
          return Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
        })();
        const imports = bareImports(join(projectDirectory, 'dist/features/ui'));
        const undeclared = imports.filter(
          (id) => !declared.some((name) => id === name || id.startsWith(`${name}/`))
        );

        // shadcn installed something for the button, and none of it was bundled
        expect(declared.length).toBeGreaterThan(4);
        expect(imports.length).toBeGreaterThan(0);
        expect(undeclared).toEqual([]);
      },
      SLOW
    );
  });

  describe('application', () => {
    it(
      'should generate an application with logging and two API clients that passes next build',
      () => {
        run('pnpm exec nx g next-feature:application web --no-interactive');

        // instrumentation reaches @next-feature/logging/server ('server-only'),
        // error.tsx uses the client-safe browser logger: next build fails on
        // a broken server/client boundary
        expect(read('apps/web/instrumentation.ts')).toContain("import('@next-feature/logging/server')");
        expect(read('apps/web/lib/config/logging.ts')).toContain("createPinoOptions({ service: 'web' })");
        // logging env vars are optional overrides: documented, never required
        expect(read('apps/web/.env.example')).toContain('NEXT_PUBLIC_LOGGING_BEACON_PATH=/api/log');
        // the server-component root layout renders the package's client
        // component: only builds if 'use client' survived the library build
        expect(read('apps/web/app/layout.tsx')).toContain('<GlobalErrorHandler />');
        expect(read('node_modules/@next-feature/logging/components/global-error-handler.js')).toMatch(/^["']use client["'];/);
        expect(read('node_modules/@next-feature/client/hooks/use-api-error.js')).toMatch(/^["']use client["'];/);

        // two API clients in an app without src/: the default (from the
        // first action) and a named one, each with its own base URL var
        run('pnpm exec nx g next-feature:action getUsers -p web --no-interactive');
        run('pnpm exec nx g next-feature:action getPayments -p web --apiClient=payments --no-interactive');
        const config = read('apps/web/lib/config/client.ts');
        expect(config).toContain('export default api;');
        expect(config).toContain('export const payments = new ApiClient({');
        expect(read('apps/web/lib/actions/payment.ts')).toContain("import { payments } from '../config/client';");
        expect(read('apps/web/.env')).toMatch(/^PAYMENTS_API_URL=/m);
        expect(readJson('package.json').dependencies['@next-feature/logging']).toBe('0.0.0-e2e');

        run('pnpm exec nx build web');
      },
      SLOW
    );

    it(
      'should generate an application with auth whose API client uses getAccessToken() and passes next build',
      () => {
        run('pnpm exec nx g next-feature:application portal --useAuth --skipLogging --no-interactive');

        expect(read('apps/portal/proxy.ts')).toContain('export const proxy = auth((request) => {');
        // backend tokens never reach the session (and so the browser)
        const callbacks = read('features/auth/src/lib/auth/callbacks.ts');
        const sessionCallback = callbacks.slice(callbacks.indexOf('export const session'), callbacks.indexOf('export const redirect'));
        expect(sessionCallback).not.toMatch(/accessToken|refreshToken/);
        // OAuth sign-ins are exchanged with the backend, refused until implemented
        expect(read('features/auth/src/lib/auth/auth.config.ts')).toContain('signIn,');
        expect(read('apps/portal/.env.example')).toMatch(/^AUTH_GOOGLE_ID=$/m);

        run('pnpm exec nx g next-feature:action getProfile -p portal --no-interactive');
        const configPath = 'apps/portal/lib/config/client.ts';
        const config = read(configPath);
        expect(config).toContain('//   const token = await getAccessToken();');
        // use the documented example for real: must type-check in next build
        writeFileSync(
          join(projectDirectory, configPath),
          config
            .replace("import 'server-only';", "import 'server-only';\nimport { getAccessToken } from '@feature/auth/server';")
            .replace(/\n\s*\/\/ onAuthenticated[\s\S]*?\/\/ \},/, `
  onAuthenticated: async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = \`Bearer \${token}\`;
  },`)
        );
        expect(read(configPath)).toContain('onAuthenticated: async (config) => {\n    const token');

        run('pnpm exec nx build portal');
      },
      SLOW
    );
  });
});

/** Bare module specifiers imported by the built JS files under `dir`. */
function bareImports(dir: string): string[] {
  const ids = new Set<string>();
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.js')) {
        const source = readFileSync(path, 'utf-8');
        for (const [, id] of source.matchAll(/(?:from|import)\s*\(?\s*["']([^"'.][^"']*)["']/g)) {
          ids.add(id);
        }
      }
    }
  };
  walk(dir);
  return [...ids].sort();
}

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
  const projectName = 'test-project';
  const projectDirectory = join(process.cwd(), 'tmp', projectName);
  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });
  // Match the workspace's Nx version so the plugin's peer deps line up, and skip
  // git: tmp/ is gitignored by this repo, which breaks create-nx-workspace's git add
  const { version: nxVersion } = require('nx/package.json');
  execSync(
    `pnpm dlx create-nx-workspace@${nxVersion} ${projectName} --preset apps --nxCloud=skip --skipGit --no-interactive`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);
  return projectDirectory;
}

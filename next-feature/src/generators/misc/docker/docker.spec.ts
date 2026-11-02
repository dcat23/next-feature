import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { getPackageManagerVersion, readProjectConfiguration, Tree, updateJson } from '@nx/devkit';
import { applicationGenerator } from '../../project/application/application';
import { libraryGenerator } from '@nx/js';
import { dockerGenerator, resolveNodeVersion } from './docker';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  getPackageManagerVersion: jest.fn(() => '11.9.0'),
}));

jest.mock('../../../lib/utils/shadcn', () => ({
  ...jest.requireActual('../../../lib/utils/shadcn'),
  installShadcnBaseTask: jest.fn(() => jest.fn()),
}));

describe('docker generator', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('pnpm-lock.yaml', '');
    await applicationGenerator(tree, { name: 'web', skipLogging: true, skipFormat: true });
  });

  const dockerfile = () => tree.read('apps/web/Dockerfile', 'utf-8') ?? '';
  const compose = () => tree.read('compose.yaml', 'utf-8') ?? '';

  describe('Dockerfile', () => {
    it('builds the app with Nx in a builder stage and runs the standalone server as a non-root user', async () => {
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      const content = dockerfile();
      expect(content).toContain('ENV NEXT_OUTPUT=standalone');
      expect(content).toContain('RUN pnpm exec nx build web --skip-nx-cache');
      expect(content).toContain('COPY --from=builder --chown=node:node /workspace/dist/apps/web/.next/standalone ./');
      expect(content).toContain('/workspace/dist/apps/web/.next/static ./dist/apps/web/.next/static');
      expect(content).toContain('USER node');
      expect(content).toContain('CMD ["node", "apps/web/server.js"]');
      // commands are written raw, not HTML-escaped by EJS
      expect(content).not.toMatch(/&amp;|&lt;|&gt;|&#/);
    });

    it('pins the workspace package manager and uses its frozen install, with a cache mount', async () => {
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      const content = dockerfile();
      expect(content).toContain('RUN corepack enable && corepack prepare pnpm@11.9.0 --activate');
      expect(content).toContain(
        'RUN --mount=type=cache,id=pnpm-cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile'
      );
    });

    it('prefers the package.json packageManager field', async () => {
      updateJson(tree, 'package.json', (json) => ({ ...json, packageManager: 'pnpm@10.4.1+sha512.abc' }));
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      expect(dockerfile()).toContain('corepack prepare pnpm@10.4.1 --activate');
    });

    it('supports npm workspaces', async () => {
      tree.delete('pnpm-lock.yaml');
      tree.write('package-lock.json', '{}');
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      const content = dockerfile();
      expect(content).not.toContain('corepack');
      expect(content).toContain('--mount=type=cache,id=npm-cache,target=/root/.npm npm ci');
      expect(content).toContain('RUN npx nx build web');
    });

    it('supports yarn workspaces', async () => {
      tree.delete('pnpm-lock.yaml');
      tree.write('yarn.lock', '');
      (getPackageManagerVersion as jest.Mock).mockReturnValueOnce('4.5.0');
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      expect(dockerfile()).toContain('corepack prepare yarn@4.5.0 --activate');
      expect(dockerfile()).toContain('RUN yarn nx build web');
    });

    it('uses the Node major from .nvmrc', async () => {
      tree.write('.nvmrc', 'v22.11.0\n');
      expect(resolveNodeVersion(tree)).toBe('22');
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      expect(dockerfile()).toContain('ARG NODE_VERSION=22');
    });

    it('copies public/ when the app has one', async () => {
      tree.write('apps/web/public/favicon.ico', '');
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      expect(dockerfile()).toContain('/workspace/apps/web/public ./apps/web/public');
    });

    it('checks the health route when the app has one, else the home page', async () => {
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      expect(dockerfile()).toMatch(/HEALTHCHECK[\s\S]*\(process\.env\.PORT \|\| 3000\) \+ '\/'\)/);

      tree.write('apps/web/app/api/health/route.ts', 'export const GET = () => Response.json({ status: "ok" });');
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      expect(dockerfile()).toContain("+ '/api/health')");
    });
  });

  describe('next.config.js', () => {
    it('switches to standalone output only when NEXT_OUTPUT=standalone, tracing from the workspace root', async () => {
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      const config = tree.read('apps/web/next.config.js', 'utf-8');
      expect(config).toContain("...(process.env.NEXT_OUTPUT === 'standalone' && {");
      expect(config).toContain("output: 'standalone',");
      expect(config).toContain("outputFileTracingRoot: require('path').join(__dirname, '../../'),");
    });

    it('is idempotent', async () => {
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      const config = tree.read('apps/web/next.config.js', 'utf-8') ?? '';
      expect(config.match(/output: 'standalone'/g)).toHaveLength(1);
    });
  });

  describe('.dockerignore', () => {
    it('keeps env files, node_modules and build output out of the build context', async () => {
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      const ignore = tree.read('.dockerignore', 'utf-8') ?? '';
      for (const entry of ['**/.env', '**/.env.*', '!**/.env.example', '**/node_modules', 'dist', '.nx', '**/.next']) {
        expect(ignore.split('\n')).toContain(entry);
      }
    });

    it('merges into an existing file', async () => {
      tree.write('.dockerignore', 'secrets/\n**/.env');
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      const lines = (tree.read('.dockerignore', 'utf-8') ?? '').split('\n');
      expect(lines).toContain('secrets/');
      expect(lines.filter((line) => line === '**/.env')).toHaveLength(1);
    });
  });

  describe('compose.yaml', () => {
    it('adds the service at the workspace root with the app env file', async () => {
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      const content = compose();
      expect(content).toMatch(/^services:\n {2}web:\n/);
      expect(content).toContain('dockerfile: apps/web/Dockerfile');
      expect(content).toContain("- '3000:3000'");
      expect(content).toContain('- path: apps/web/.env\n        required: false');
      expect(content).toContain("PORT: '3000'");
      expect(content).toContain("- 'host.docker.internal:host-gateway'");
      expect(content).not.toContain('NEXTAUTH_URL');
    });

    it('adds more apps to the same file without touching existing services or sections', async () => {
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      tree.write('compose.yaml', `${compose()}volumes:\n  data: {}\n`);
      await applicationGenerator(tree, { name: 'admin', skipLogging: true, skipFormat: true });
      await dockerGenerator(tree, { projectName: 'admin', port: 3001, skipFormat: true });

      const content = compose();
      expect(content).toContain("  admin:\n");
      expect(content).toContain("- '3001:3000'");
      expect(content).toContain('  web:\n');
      expect(content).toContain('volumes:\n  data: {}');
      expect(content.match(/^services:/gm)).toHaveLength(1);
    });

    it('leaves an existing service unchanged', async () => {
      tree.write('compose.yaml', 'services:\n  web:\n    image: custom\n');
      await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
      expect(compose()).toBe('services:\n  web:\n    image: custom\n');
    });

    it('sets the Auth.js URL for apps with auth', async () => {
      await applicationGenerator(tree, { name: 'portal', useAuth: true, skipLogging: true, skipFormat: true });
      await dockerGenerator(tree, { projectName: 'portal', port: 3002, skipFormat: true });
      expect(compose()).toContain('NEXTAUTH_URL: http://localhost:3002');
      expect(compose()).toContain("AUTH_TRUST_HOST: 'true'");
    });

    it('is skipped with compose: false', async () => {
      await dockerGenerator(tree, { projectName: 'web', compose: false, skipFormat: true });
      expect(tree.exists('compose.yaml')).toBe(false);
      expect(readProjectConfiguration(tree, 'web').targets?.['docker-run']?.options.command).toBe(
        'docker run --rm -p 3000:3000 web'
      );
    });
  });

  it('adds docker-build and docker-run targets', async () => {
    await dockerGenerator(tree, { projectName: 'web', skipFormat: true });
    const targets = readProjectConfiguration(tree, 'web').targets ?? {};
    expect(targets['docker-build'].options.command).toBe('docker build -f apps/web/Dockerfile -t web .');
    expect(targets['docker-run'].options.command).toBe('docker compose up --build web');
  });

  it('rejects projects that are not Next.js applications', async () => {
    await libraryGenerator(tree, { directory: 'libs/util', name: 'util', skipFormat: true } as never);
    await expect(dockerGenerator(tree, { projectName: 'util', skipFormat: true })).rejects.toThrow(
      "isn't a Next.js application"
    );
  });
});

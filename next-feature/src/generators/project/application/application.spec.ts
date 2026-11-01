import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readJson, readProjectConfiguration } from '@nx/devkit';
import { applicationGenerator } from './application';
import { ApplicationGeneratorSchema } from './schema';
describe('application generator', () => {
  let tree: Tree;
  const options: ApplicationGeneratorSchema = { name: 'test' };
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });
  it('should run successfully', async () => {
    await applicationGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should register a shadcn target on the project', async () => {
    await applicationGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config.targets?.shadcn?.executor).toBe('next-feature:shadcn');
  });

  describe('proxy', () => {
    const matcher = String.raw`'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'`;

    it('should generate a passthrough proxy.ts with the matcher config by default', async () => {
      await applicationGenerator(tree, options);
      const proxy = tree.read('apps/test/proxy.ts', 'utf-8');
      expect(proxy).toContain('export function proxy(request: NextRequest)');
      expect(proxy).not.toContain('next-auth');
      expect(proxy).toContain(matcher);
      expect(proxy).toContain("'/(api)(.*)'");
    });

    it('should wrap the proxy with the auth feature\'s auth() when useAuth is true', async () => {
      await applicationGenerator(tree, { name: 'test', useAuth: true });
      const proxy = tree.read('apps/test/proxy.ts', 'utf-8');
      expect(proxy).toContain("import { auth } from '@feature/auth/server';");
      expect(proxy).not.toContain('NextAuth(');
      expect(proxy).toContain('export const proxy = auth((request) => {');
      expect(proxy).toContain(matcher);
    });

    it('should put proxy.ts in src/ with useSrc', async () => {
      await applicationGenerator(tree, { name: 'test', useSrc: true });
      expect(tree.exists('apps/test/src/proxy.ts')).toBeTruthy();
    });
  });

  describe('useAuth option', () => {
    it('should not generate the auth route or feature by default', async () => {
      await applicationGenerator(tree, { name: 'test' });
      expect(tree.exists('apps/test/app/api/auth/[...nextauth]/route.ts')).toBeFalsy();
      expect(() => readProjectConfiguration(tree, 'auth')).toThrow();
    });

    it('should not require next-auth by default', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.['next-auth']).toBeUndefined();
    });

    it('should generate the auth route handler when useAuth is true', async () => {
      await applicationGenerator(tree, { name: 'test', useAuth: true });
      const route = tree.read('apps/test/app/api/auth/[...nextauth]/route.ts', 'utf-8');
      expect(route).toContain("from '@feature/auth/server'");
    });

    it('should wrap providers with SessionProvider when useAuth is true', async () => {
      await applicationGenerator(tree, { name: 'test', useAuth: true });
      const providers = tree.read('apps/test/app/providers.tsx', 'utf-8');
      expect(providers).toContain('SessionProvider');
    });

    it('should not wrap providers with SessionProvider by default', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const providers = tree.read('apps/test/app/providers.tsx', 'utf-8');
      expect(providers).not.toContain('SessionProvider');
    });

    it('should create a sibling @feature/auth library when missing', async () => {
      await applicationGenerator(tree, { name: 'test', useAuth: true });
      const config = readProjectConfiguration(tree, 'auth');
      expect(config.root).toBe('features/auth');
      expect(tree.exists('features/auth/src/lib/auth/index.ts')).toBeTruthy();
    });

    it('should not recreate the auth library if one already exists', async () => {
      await applicationGenerator(tree, { name: 'first', useAuth: true });
      tree.write('features/auth/src/lib/auth/index.ts', '// customized by user');
      await applicationGenerator(tree, { name: 'second', useAuth: true });
      expect(tree.read('features/auth/src/lib/auth/index.ts', 'utf-8')).toContain('// customized by user');
    });

    it('should add next-auth dependency and auth env vars when useAuth is true', async () => {
      await applicationGenerator(tree, { name: 'test', useAuth: true });
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.['next-auth']).toBeDefined();
      const dotenv = tree.read('apps/test/.env', 'utf-8');
      expect(dotenv).toContain('AUTH_SECRET');
      expect(dotenv).toContain('NEXTAUTH_URL');
    });

    it('should document the OAuth provider credentials in .env.example only', async () => {
      await applicationGenerator(tree, { name: 'test', useAuth: true });
      const example = tree.read('apps/test/.env.example', 'utf-8');
      for (const key of ['AUTH_GITHUB_ID', 'AUTH_GITHUB_SECRET', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET']) {
        expect(example).toMatch(new RegExp(`^${key}=$`, 'm'));
      }
      expect(tree.read('apps/test/.env', 'utf-8')).not.toContain('AUTH_GITHUB_ID');
    });
  });

  describe('logging', () => {
    it('should call registerPino from @next-feature/logging/server in instrumentation.ts', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const instrumentation = tree.read('apps/test/instrumentation.ts', 'utf-8');
      expect(instrumentation).toContain("process.env.NEXT_RUNTIME === 'nodejs'");
      expect(instrumentation).toContain("import('@next-feature/logging/server')");
      expect(instrumentation).toContain('await registerPino(pinoOptions);');
    });

    it('should configure the app as the service in lib/config/logging.ts instead of copying registerPino', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const logging = tree.read('apps/test/lib/config/logging.ts', 'utf-8');
      expect(logging).toContain("import { createPinoOptions } from '@next-feature/logging/server'");
      expect(logging).toContain("createPinoOptions({ service: 'test' })");
      expect(logging).not.toContain('pinoHttp');
    });

    it('should not tie the log route to the beacon path env var', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const route = tree.read('apps/test/app/api/log/route.ts', 'utf-8');
      expect(route).not.toContain('NEXT_PUBLIC_LOGGING_BEACON_PATH');
      expect(route).toContain('request.nextUrl.pathname');
      expect(route).toContain("/lib/config/logging'");
    });

    it('should document the logging vars as optional overrides in .env.example only', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const example = tree.read('apps/test/.env.example', 'utf-8');
      expect(example).toContain('NEXT_PUBLIC_LOGGING_BEACON_PATH=/api/log');
      expect(example).toContain('LOGGING_SERVICE_NAME=test');
      expect(tree.read('apps/test/.env', 'utf-8') ?? '').not.toContain('LOGGING');
      expect(tree.read('apps/test/lib/config/env.ts', 'utf-8')).not.toContain('LOGGING');
    });

    it('should add @next-feature/logging as an installed dependency by default', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.['@next-feature/logging']).toBeDefined();
    });

    it('should raise an older installed @next-feature/logging', async () => {
      const root = readJson(tree, 'package.json');
      tree.write('package.json', JSON.stringify({ ...root, dependencies: { ...root.dependencies, '@next-feature/logging': '0.1.0' } }));
      await applicationGenerator(tree, { name: 'test' });
      expect(readJson(tree, 'package.json').dependencies['@next-feature/logging']).not.toBe('0.1.0');
    });

    it('should mark pino packages as serverExternalPackages in next.config.js by default', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const nextConfig = tree.read('apps/test/next.config.js', 'utf-8');
      expect(nextConfig).toContain("serverExternalPackages: ['pino', 'pino-http', 'pino-pretty', 'thread-stream']");
    });

    it('should skip logging wiring when skipLogging is true', async () => {
      await applicationGenerator(tree, { name: 'test', skipLogging: true });
      const instrumentation = tree.read('apps/test/instrumentation.ts', 'utf-8');
      expect(instrumentation).not.toContain('@next-feature/logging');
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.['@next-feature/logging']).toBeUndefined();
      const nextConfig = tree.read('apps/test/next.config.js', 'utf-8');
      expect(nextConfig).not.toContain('serverExternalPackages');
    });

    it('should render GlobalErrorHandler from @next-feature/logging in the root layout', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const layout = tree.read('apps/test/app/layout.tsx', 'utf-8');
      expect(layout).toContain("import { GlobalErrorHandler } from '@next-feature/logging';");
      expect(layout).toContain('<GlobalErrorHandler />');
    });

    it('should not generate files that import @next-feature/logging when skipLogging is true', async () => {
      await applicationGenerator(tree, { name: 'test', skipLogging: true });
      expect(tree.read('apps/test/app/layout.tsx', 'utf-8')).not.toContain('GlobalErrorHandler');
      expect(tree.exists('apps/test/app/api/log/route.ts')).toBeFalsy();
      expect(tree.exists('apps/test/lib/config/logging.ts')).toBeFalsy();
      const error = tree.read('apps/test/app/error.tsx', 'utf-8');
      expect(error).not.toContain('@next-feature/logging');
      expect(error).toContain('console.error(error)');
      expect(tree.read('apps/test/.env.example', 'utf-8') ?? '').not.toContain('LOGGING');
    });
  });
});

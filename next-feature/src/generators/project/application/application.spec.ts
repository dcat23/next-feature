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
  });

  describe('logging', () => {
    it('should wire registerPino into instrumentation.ts by default', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const instrumentation = tree.read('apps/test/instrumentation.ts', 'utf-8');
      expect(instrumentation).toContain("import { registerPino } from '@next-feature/logging/server'");
      expect(instrumentation).toContain('registerPino();');
    });

    it('should add @next-feature/logging as an installed dependency by default', async () => {
      await applicationGenerator(tree, { name: 'test' });
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.['@next-feature/logging']).toBeDefined();
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
  });
});

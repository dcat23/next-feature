import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';
import { featureGenerator } from './feature';
import { addRollupExternalPackages } from '../../../lib/utils/vite-config';
import { FeatureGeneratorSchema } from './schema';
import { normalizeFeatureGenerator } from './utils/normalize';

describe('feature generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('basic functionality', () => {
    const options: FeatureGeneratorSchema = { name: 'test', skipFormat: true };

    it('should create project with correct configuration', async () => {
      await featureGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'test');
      expect(config.root).toBe('features/test');
      expect(config.sourceRoot).toBe('features/test/src');
      expect(config.projectType).toBe('library');
    });

    it('should set import path in tsconfig', async () => {
      await featureGenerator(tree, options);
      const tsConfig = tree.read('tsconfig.base.json', 'utf-8');
      expect(tsConfig).toContain('@feature/test');
      expect(tsConfig).toContain('features/test/src');
    });

    it('should use custom orgName in import path', async () => {
      await featureGenerator(tree, { name: 'test', orgName: 'myorg', skipFormat: true });
      const tsConfig = tree.read('tsconfig.base.json', 'utf-8');
      expect(tsConfig).toContain('@myorg/test');
    });

    it('should generate src files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/test/src/lib/config/env.ts')).toBeTruthy();
    });

    it('should delete hello-server.tsx scaffold file', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/test/src/lib/hello-server.tsx')).toBeFalsy();
    });

    it('should guard server.ts with server-only', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/test/src/server.ts', 'utf-8');
      expect(content).toContain("import 'server-only';");
    });

    it('should add server-only dependency and externalize it in the vite build', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies['server-only']).toBeDefined();
      const viteConfig = tree.read('features/test/vite.config.mts', 'utf-8');
      expect(viteConfig).toContain("'server-only'");
    });
  });

  describe('type normalization', () => {
    it('should default type to generic for unknown names', () => {
      const normalized = normalizeFeatureGenerator({ name: 'test' });
      expect(normalized.type).toBe('generic');
    });

    it('should set type to base when name is base and type is not specified', () => {
      const normalized = normalizeFeatureGenerator({ name: 'base' });
      expect(normalized.type).toBe('base');
    });

    it('should set type to base when name is base and type is generic', () => {
      const normalized = normalizeFeatureGenerator({ name: 'base', type: 'generic' });
      expect(normalized.type).toBe('base');
    });

    it('should set type to logging when name is logging and type is not specified', () => {
      const normalized = normalizeFeatureGenerator({ name: 'logging' });
      expect(normalized.type).toBe('logging');
    });

    it('should set type to logging when name is logging and type is generic', () => {
      const normalized = normalizeFeatureGenerator({ name: 'logging', type: 'generic' });
      expect(normalized.type).toBe('logging');
    });

    it('should keep explicit type for non-inferred names', () => {
      expect(normalizeFeatureGenerator({ name: 'test', type: 'logging' }).type).toBe('logging');
      expect(normalizeFeatureGenerator({ name: 'test', type: 'base' }).type).toBe('base');
    });

    it('should allow explicit type override on inferred names', () => {
      expect(normalizeFeatureGenerator({ name: 'base', type: 'logging' }).type).toBe('logging');
      expect(normalizeFeatureGenerator({ name: 'logging', type: 'base' }).type).toBe('base');
    });

    it('should set type to client when name is client and type is not specified', () => {
      const normalized = normalizeFeatureGenerator({ name: 'client' });
      expect(normalized.type).toBe('client');
    });

    it('should use the standard @feature import scope for client type without an explicit orgName', () => {
      const normalized = normalizeFeatureGenerator({ name: 'apiClient', type: 'client' });
      expect(normalized.importPath).toBe('@feature/apiClient');
    });

    it('should respect an explicit orgName for client type', () => {
      const normalized = normalizeFeatureGenerator({ name: 'apiClient', type: 'client', orgName: 'myorg' });
      expect(normalized.importPath).toBe('@myorg/apiClient');
    });

    it('should set type to auth when name is auth and type is not specified', () => {
      const normalized = normalizeFeatureGenerator({ name: 'auth' });
      expect(normalized.type).toBe('auth');
    });
  });

  describe('generic type', () => {
    const options: FeatureGeneratorSchema = { name: 'test', type: 'generic', skipFormat: true };

    it('should not generate logging files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/test/src/config.ts')).toBeFalsy();
      expect(tree.exists('features/test/src/lib/server.ts')).toBeFalsy();
      expect(tree.exists('features/test/src/lib/client.ts')).toBeFalsy();
      expect(tree.exists('features/test/src/lib/correlation.ts')).toBeFalsy();
    });

    it('should not generate base component files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/test/src/components/error-component.tsx')).toBeFalsy();
    });

    it('should not add pino dependencies', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.pino).toBeUndefined();
      expect(packageJson.devDependencies?.['pino-pretty']).toBeUndefined();
    });
  });

  describe('logging type', () => {
    const options: FeatureGeneratorSchema = { name: 'logger', type: 'logging', skipFormat: true };

    it('should generate logging files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/logger/src/config.ts')).toBeTruthy();
      expect(tree.exists('features/logger/src/lib/server.ts')).toBeTruthy();
      expect(tree.exists('features/logger/src/lib/client.ts')).toBeTruthy();
      expect(tree.exists('features/logger/src/lib/correlation.ts')).toBeTruthy();
    });

    it('should not generate base component files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/logger/src/components/error-component.tsx')).toBeFalsy();
    });

    it('should add pino dependencies', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.pino).toBeDefined();
      expect(packageJson.dependencies?.['pino-pretty']).toBeDefined();
    });

    it('should generate server logger implementation', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/src/lib/server.ts', 'utf-8');
      expect(content).toContain("from 'pino'");
      expect(content).toContain('pinoOptions');
    });

    it('should externalize pino packages in the vite build so the wrong browser/node build is not bundled in', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/vite.config.mts', 'utf-8');
      expect(content).toContain("external: ['react','react-dom','react/jsx-runtime','server-only','zod','pino','pino-http','pino-pretty','thread-stream']");
    });

    it('should generate browser client logger with use client directive', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/src/lib/client.ts', 'utf-8');
      expect(content).toContain("'use client'");
      expect(content).toContain("from 'pino'");
    });

    it('should generate correlation utilities', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/src/lib/correlation.ts', 'utf-8');
      expect(content).toContain('getCorrelationId');
      expect(content).toContain('setCorrelationId');
    });

    it('should generate pino config with pinoOptions export', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/src/config.ts', 'utf-8');
      expect(content).toContain('pinoOptions');
      expect(content).toContain('pino-pretty');
    });

    it('should generate index.ts exporting browser logger and correlation', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/src/index.ts', 'utf-8');
      expect(content).toContain("export { default as logger } from './lib/client'");
      expect(content).toContain("export * from './lib/correlation'");
    });

    it('should generate server.ts exporting server logger', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/src/server.ts', 'utf-8');
      expect(content).toContain("export { default as logger } from");
      expect(content.startsWith("import 'server-only';")).toBe(true);
      expect(content).toContain('./lib/server');
    });

    it.each(['config.ts', 'lib/server.ts', 'lib/utils/index.ts'])(
      'should mark %s as server-only',
      async (file) => {
        await featureGenerator(tree, options);
        const content = tree.read(`features/logger/src/${file}`, 'utf-8');
        expect(content.startsWith("import 'server-only';")).toBe(true);
      }
    );

    it('should keep client-safe modules free of server-only', async () => {
      await featureGenerator(tree, options);
      for (const file of ['index.ts', 'lib/client.ts', 'lib/correlation.ts', 'components/global-error-handler.tsx']) {
        expect(tree.read(`features/logger/src/${file}`, 'utf-8')).not.toContain('server-only');
      }
    });
  });

  describe('logging name inference', () => {
    it('should infer logging type from name logging', async () => {
      await featureGenerator(tree, { name: 'logging', skipFormat: true });
      expect(tree.exists('features/logging/src/config.ts')).toBeTruthy();
      expect(tree.exists('features/logging/src/lib/server.ts')).toBeTruthy();
      expect(tree.exists('features/logging/src/lib/client.ts')).toBeTruthy();
    });

    it('should add pino deps when name is logging', async () => {
      await featureGenerator(tree, { name: 'logging', skipFormat: true });
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.pino).toBeDefined();
    });
  });

  describe('client type', () => {
    const options: FeatureGeneratorSchema = { name: 'apiClient', type: 'client', skipFormat: true };

    it('should generate client files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/apiClient/src/lib/client.ts')).toBeTruthy();
      expect(tree.exists('features/apiClient/src/lib/error.ts')).toBeTruthy();
      expect(tree.exists('features/apiClient/src/lib/actions/with-api.ts')).toBeTruthy();
      expect(tree.exists('features/apiClient/src/hooks/use-api-error.tsx')).toBeTruthy();
      expect(tree.exists('features/apiClient/src/components/api-error-boundary.tsx')).toBeTruthy();
    });

    it('should not generate logging or base files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/apiClient/src/config.ts')).toBeFalsy();
      expect(tree.exists('features/apiClient/src/components/error-component.tsx')).toBeFalsy();
    });

    it('should add axios dependency', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.axios).toBeDefined();
    });

    it('should generate a client-safe index.ts exporting the error and types, but not ApiClient', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/apiClient/src/index.ts', 'utf-8');
      expect(content).toContain("export { ApiError } from './lib/error'");
      expect(content).not.toContain("from './lib/client'");
      expect(content).not.toContain('with-api');
    });

    it('should generate server.ts exporting ApiClient and the withApi action wrapper', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/apiClient/src/server.ts', 'utf-8');
      expect(content.startsWith("import 'server-only';")).toBe(true);
      expect(content).toContain("export * from './lib/actions/with-api'");
      expect(content).toContain("export * from './lib/client'");
    });

    it('should return a serializable ProblemDetail (not an ApiError instance) from withApi', async () => {
      await featureGenerator(tree, options);
      const types = tree.read('features/apiClient/src/lib/types/index.ts', 'utf-8');
      expect(types).toContain('error?: ProblemDetail;');
      expect(types).not.toContain("from '../error'");
      const withApi = tree.read('features/apiClient/src/lib/actions/with-api.ts', 'utf-8');
      expect(withApi).toContain('error: apiError.problemDetail,');
    });

    it('should rehydrate a ProblemDetail into an ApiError via ApiError.of', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/apiClient/src/lib/utils/problem-detail.ts')).toBeTruthy();
      const error = tree.read('features/apiClient/src/lib/utils/error.ts', 'utf-8');
      expect(error).toContain('if (isProblemDetail(error)) {');
      expect(error).toContain('return new ApiError(error);');
      const index = tree.read('features/apiClient/src/index.ts', 'utf-8');
      expect(index).toContain("export * from './lib/utils/problem-detail'");
    });

    it.each(['lib/client.ts', 'lib/actions/with-api.ts'])(
      'should mark %s as server-only',
      async (file) => {
        await featureGenerator(tree, options);
        const content = tree.read(`features/apiClient/src/${file}`, 'utf-8');
        expect(content.startsWith("import 'server-only';")).toBe(true);
      }
    );

    it('should fix package.json exports to remove the ./dist/ prefix', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'features/apiClient/package.json');
      expect(packageJson.exports['.'].import).toBe('./index.js');
      expect(packageJson.exports['./server'].import).toBe('./server.js');
    });

    it('should use the standard @feature import path like other types', async () => {
      await featureGenerator(tree, options);
      const tsConfig = tree.read('tsconfig.base.json', 'utf-8');
      expect(tsConfig).toContain('@feature/apiClient');
    });
  });

  describe('client name inference', () => {
    it('should infer client type from name client', async () => {
      await featureGenerator(tree, { name: 'client', skipFormat: true });
      expect(tree.exists('features/client/src/lib/client.ts')).toBeTruthy();
      expect(tree.exists('features/client/src/lib/error.ts')).toBeTruthy();
    });
  });

  describe('auth type', () => {
    const options: FeatureGeneratorSchema = { name: 'auth', type: 'auth', skipFormat: true };

    it('should generate auth files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/auth/src/lib/auth/index.ts')).toBeTruthy();
      expect(tree.exists('features/auth/src/lib/auth/auth.config.ts')).toBeTruthy();
      expect(tree.exists('features/auth/src/lib/auth/callbacks.ts')).toBeTruthy();
      expect(tree.exists('features/auth/src/lib/types/next-auth.d.ts')).toBeTruthy();
    });

    it('should not generate logging, base, or client files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/auth/src/config.ts')).toBeFalsy();
      expect(tree.exists('features/auth/src/components/error-component.tsx')).toBeFalsy();
      expect(tree.exists('features/auth/src/lib/client.ts')).toBeFalsy();
    });

    it('should add the next-auth dependency', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.['next-auth']).toBeDefined();
    });

    it('should assemble callbacks as named methods in auth.config.ts', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/lib/auth/auth.config.ts', 'utf-8');
      expect(content).toContain("import { authorized, jwt, redirect, session } from './callbacks'");
      expect(content).toContain('callbacks: {\n    authorized,\n    jwt,\n    session,\n    redirect,\n  }');
    });

    it('should export named callback functions from callbacks.ts', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/lib/auth/callbacks.ts', 'utf-8');
      expect(content).toContain('export const jwt');
      expect(content).toContain('export const session');
      expect(content).toContain('export const redirect');
      expect(content).toContain('export const authorized');
    });

    it('should have index.ts spread authConfig and only define providers', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/lib/auth/index.ts', 'utf-8');
      expect(content).toContain('...authConfig');
      expect(content).toContain('providers: [');
      expect(content).not.toContain('callbacks:');
    });

    it('should include common OAuth providers alongside credentials', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/lib/auth/index.ts', 'utf-8');
      expect(content).toContain("from 'next-auth/providers/github'");
      expect(content).toContain("from 'next-auth/providers/google'");
      expect(content).toContain("from 'next-auth/providers/discord'");
      expect(content).toContain("from 'next-auth/providers/facebook'");
      expect(content).toContain('CredentialsProvider');
    });

    it('should export authConfig and augmented types from the root index.ts', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/index.ts', 'utf-8');
      expect(content).toContain("export { authConfig } from './lib/auth/auth.config'");
      expect(content).toContain("export type { JWT, Session, User } from './lib/types/next-auth'");
    });

    it('should export the server-only NextAuth instance from server.ts', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/server.ts', 'utf-8');
      expect(content).toContain("export { auth, handlers, signIn, signOut } from './lib/auth'");
    });
  });

  describe('auth name inference', () => {
    it('should infer auth type from name auth', async () => {
      await featureGenerator(tree, { name: 'auth', skipFormat: true });
      expect(tree.exists('features/auth/src/lib/auth/index.ts')).toBeTruthy();
    });
  });

  describe('base type', () => {
    const options: FeatureGeneratorSchema = { name: 'base', skipFormat: true };

    it('should auto-resolve to base type when name is base', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/base/src/components/error-component.tsx')).toBeTruthy();
    });

    it('should not generate logging files for base type', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/base/src/config.ts')).toBeFalsy();
      expect(tree.exists('features/base/src/lib/server.ts')).toBeFalsy();
    });

    it('should not add pino dependencies for base type', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.pino).toBeUndefined();
    });

    it('should add base sonner and zod dependencies', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.sonner).toBeDefined();
      expect(packageJson.dependencies?.zod).toBeDefined();
    });
  });

  describe('ui type', () => {
    const options: FeatureGeneratorSchema = { name: 'ui', type: 'ui', skipFormat: true };

    it('should generate components.json at the project root, not under src/', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/ui/components.json')).toBeTruthy();
      expect(tree.exists('features/ui/src/components.json')).toBeFalsy();
    });

    it('should generate components.json aliases pointing at the feature import path', async () => {
      await featureGenerator(tree, options);
      const componentsJson = readJson(tree, 'features/ui/components.json');
      expect(componentsJson.aliases.utils).toBe('@feature/ui/lib/ui/utils');
      expect(componentsJson.aliases.ui).toBe('@feature/ui/components/ui/common');
      expect(componentsJson.tailwind.css).toBe('src/styles/globals.css');
    });

    // shadcn init writes the cn() utility to the `utils` alias itself
    it('should not generate the cn() utility', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/ui/src/lib/ui/utils/index.ts')).toBeFalsy();
      expect(tree.exists('features/ui/src/lib/utils/index.ts')).toBeFalsy();
    });

    it('should generate a tailwind css entry', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/ui/src/styles/globals.css')).toBeTruthy();
    });

    it('should not generate logging, client, or auth files', async () => {
      await featureGenerator(tree, options);
      expect(tree.exists('features/ui/src/config.ts')).toBeFalsy();
      expect(tree.exists('features/ui/src/lib/client.ts')).toBeFalsy();
    });

    // shadcn init/add installs these alongside the files that need them
    it('should not add shadcn component dependencies', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      for (const pkg of ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react']) {
        expect(packageJson.dependencies?.[pkg]).toBeUndefined();
      }
    });

    it('should register a shadcn target on the project', async () => {
      await featureGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'ui');
      expect(config.targets?.shadcn?.executor).toBe('next-feature:shadcn');
    });
  });

  describe('ui name inference', () => {
    it('should infer ui type from name ui', async () => {
      const normalized = normalizeFeatureGenerator({ name: 'ui' });
      expect(normalized.type).toBe('ui');
    });

    it('should generate ui files when name is ui', async () => {
      await featureGenerator(tree, { name: 'ui', skipFormat: true });
      expect(tree.exists('features/ui/components.json')).toBeTruthy();
    });
  });

  describe('published library dependencies', () => {
    const readLibPackageJson = (name: string) => readJson(tree, `features/${name}/package.json`);

    it('should declare every feature\'s externals in its own package.json, with react as a peer', async () => {
      await featureGenerator(tree, { name: 'test', skipFormat: true });
      const pkg = readLibPackageJson('test');
      expect(pkg.dependencies).toEqual({ 'server-only': '^0.0.1', zod: '^3.24.4' });
      expect(pkg.peerDependencies).toEqual({ react: '^19.0.0', 'react-dom': '^19.0.0' });
      expect(tree.read('features/test/vite.config.mts', 'utf-8')).toContain("'server-only','zod'");
    });

    it('should externalize and declare axios for client features', async () => {
      await featureGenerator(tree, { name: 'apiClient', type: 'client', skipFormat: true });
      const pkg = readLibPackageJson('apiClient');
      expect(pkg.dependencies).toEqual({ axios: '^1.9.0', 'server-only': '^0.0.1', zod: '^3.24.4' });
      expect(tree.read('features/apiClient/vite.config.mts', 'utf-8')).toContain("'server-only','zod','axios'");
    });

    it('should declare pino packages for logging features', async () => {
      await featureGenerator(tree, { name: 'logger', type: 'logging', skipFormat: true });
      expect(readLibPackageJson('logger').dependencies).toEqual({
        pino: '^10.3.1',
        'pino-http': '^11.0.0',
        'pino-pretty': '^13.0.0',
        'server-only': '^0.0.1',
        zod: '^3.24.4',
      });
    });

    it('should make sonner a peer for base features so toast() reaches the app\'s <Toaster />', async () => {
      await featureGenerator(tree, { name: 'base', type: 'base', skipFormat: true });
      expect(readLibPackageJson('base').peerDependencies).toEqual({
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        sonner: '^2.0.3',
      });
      expect(tree.read('features/base/vite.config.mts', 'utf-8')).toContain("'sonner'");
    });

    it('should make next-auth a peer for auth features and externalize its subpath imports', async () => {
      await featureGenerator(tree, { name: 'auth', type: 'auth', skipFormat: true });
      expect(readLibPackageJson('auth').peerDependencies['next-auth']).toBe('^5.0.0-beta.27');
      const vite = tree.read('features/auth/vite.config.mts', 'utf-8');
      expect(vite).toContain("'next-auth',/^next-auth\\//]");
    });

    it('should keep regex externals intact when more packages are added later', async () => {
      await featureGenerator(tree, { name: 'auth', type: 'auth', skipFormat: true });
      addRollupExternalPackages(tree, 'features/auth', ['extra', /^next-auth\//]);
      const vite = tree.read('features/auth/vite.config.mts', 'utf-8');
      expect(vite).toContain("'next-auth',/^next-auth\\//,'extra']");
    });
  });

  describe('dependencies', () => {
    it('should always add sonner and zod', async () => {
      await featureGenerator(tree, { name: 'test', skipFormat: true });
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.sonner).toBeDefined();
      expect(packageJson.dependencies?.zod).toBeDefined();
    });

    it('should use correct pino version format', async () => {
      await featureGenerator(tree, { name: 'test', type: 'logging', skipFormat: true });
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.pino).toMatch(/^\^?\d+\.\d+\.\d+/);
      expect(packageJson.dependencies?.['pino-pretty']).toMatch(/^\^?\d+\.\d+\.\d+/);
    });
  });

  describe('custom directory', () => {
    it('should use custom directory when provided', async () => {
      await featureGenerator(tree, { name: 'test', directory: 'libs/features/test', skipFormat: true });
      const config = readProjectConfiguration(tree, 'test');
      expect(config.root).toBe('libs/features/test');
      expect(config.sourceRoot).toBe('libs/features/test/src');
    });

    it('should generate logging files in custom directory', async () => {
      await featureGenerator(tree, {
        name: 'test',
        directory: 'libs/logging/test',
        type: 'logging',
        skipFormat: true,
      });
      expect(tree.exists('libs/logging/test/src/config.ts')).toBeTruthy();
      expect(tree.exists('libs/logging/test/src/lib/server.ts')).toBeTruthy();
    });
  });

  describe('API URL env var', () => {
    it('does not register the API URL var for generic features', async () => {
      await featureGenerator(tree, { name: 'test', skipFormat: true });
      const dotenv = tree.read('features/test/.env', 'utf-8') ?? '';
      expect(dotenv).not.toContain('API_URL');
    });

    it('registers the API URL var in .env/.env.example for client-type features', async () => {
      await featureGenerator(tree, { name: 'apiClient', type: 'client', skipFormat: true });
      const dotenv = tree.read('features/apiClient/.env', 'utf-8');
      expect(dotenv).toContain('API_URL');
      const dotenvExample = tree.read('features/apiClient/.env.example', 'utf-8');
      expect(dotenvExample).toContain('API_URL');
    });

    it('does not register the API URL var for other feature types', async () => {
      await featureGenerator(tree, { name: 'logger', type: 'logging', skipFormat: true });
      expect(tree.exists('features/logger/src/lib/server.ts')).toBeTruthy();
      const dotenv = tree.read('features/logger/.env', 'utf-8') ?? '';
      expect(dotenv).not.toContain('API_URL');
    });
  });
});

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';
import { featureGenerator } from './feature';
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
      expect(content).toContain("external: ['react','react-dom','react/jsx-runtime','pino','pino-http','pino-pretty','thread-stream']");
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
      expect(content).toContain('server');
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

    it('should generate index.ts exporting the client, error, and hooks', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/apiClient/src/index.ts', 'utf-8');
      expect(content).toContain("export { ApiClient } from './lib/client'");
      expect(content).toContain("export { ApiError } from './lib/error'");
    });

    it('should generate server.ts exporting the withApi action wrapper', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/apiClient/src/server.ts', 'utf-8');
      expect(content).toContain("export * from './lib/actions/with-api'");
    });

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
    it('registers the API URL var in .env/.env.example for every feature', async () => {
      await featureGenerator(tree, { name: 'test', skipFormat: true });
      const dotenv = tree.read('features/test/.env', 'utf-8');
      expect(dotenv).toContain('API_URL');
      const dotenvExample = tree.read('features/test/.env.example', 'utf-8');
      expect(dotenvExample).toContain('API_URL');
    });

    it('works alongside a feature type', async () => {
      await featureGenerator(tree, { name: 'logger', type: 'logging', skipFormat: true });
      expect(tree.exists('features/logger/src/lib/server.ts')).toBeTruthy();
      const dotenv = tree.read('features/logger/.env', 'utf-8');
      expect(dotenv).toContain('API_URL');
    });
  });
});

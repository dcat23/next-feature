import { LOGGING } from '../../../lib/dotenv/constants/defaults';
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

    it('should guard server.ts with server-only', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/test/src/server.ts', 'utf-8');
      expect(content).toContain("import 'server-only';");
    });

    it('should add server-only dependency and externalize it in the vite build', async () => {
      await featureGenerator(tree, options);
      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies['server-only']).toBeDefined();
      expect(readJson(tree, 'features/test/package.json').dependencies['server-only']).toBeDefined();
      const viteConfig = tree.read('features/test/vite.config.mts', 'utf-8');
      expect(viteConfig).toContain('external: isExternal');
    });
  });

  describe('type normalization', () => {
    it('should default type to generic for unknown names', () => {
      const normalized = normalizeFeatureGenerator({ name: 'test' });
      expect(normalized.type).toBe('generic');
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
      expect(normalizeFeatureGenerator({ name: 'test', type: 'client' }).type).toBe('client');
    });

    it('should allow explicit type override on inferred names', () => {
      expect(normalizeFeatureGenerator({ name: 'client', type: 'logging' }).type).toBe('logging');
      expect(normalizeFeatureGenerator({ name: 'logging', type: 'client' }).type).toBe('client');
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

    it("should keep 'use client' modules as client boundaries in the build", async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/vite.config.mts', 'utf-8');
      expect(content).toContain("import { defineConfig, type Plugin } from 'vite';");
      expect(content).toContain('preserveUseClient(),');
      expect(content).toContain("output: { preserveModules: true, preserveModulesRoot: 'src' },");
    });

    it('should externalize pino packages in the vite build so the wrong browser/node build is not bundled in', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/vite.config.mts', 'utf-8');
      // pino* are declared (externalized via package.json); thread-stream isn't
      expect(content).toContain('external: isExternal');
      expect(content).toContain("const extraExternals: string[] = ['thread-stream'];");
      expect(readJson(tree, 'features/logger/package.json').dependencies).toMatchObject({
        pino: expect.any(String),
        'pino-http': expect.any(String),
        'pino-pretty': expect.any(String),
      });
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

    it('should let LOGGING_SERVICE_NAME override the service passed to createPinoOptions', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/src/config.ts', 'utf-8');
      expect(content).toContain('export function createPinoOptions(');
      expect(content).toContain('LOGGING_SERVICE_NAME || service');
      expect(content).toContain('export const pinoOptions = createPinoOptions();');
      const server = tree.read('features/logger/src/server.ts', 'utf-8');
      expect(server).toContain('createPinoOptions');
    });

    it('should accept pino options in registerPino', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/logger/src/lib/utils/index.ts', 'utf-8');
      expect(content).toContain('registerPino = async (options: LoggerOptions = pinoOptions)');
    });

    it('should default the browser beacon path to the route the application generator creates', async () => {
      await featureGenerator(tree, options);
      const constants = tree.read('features/logger/src/lib/constants.ts', 'utf-8');
      expect(constants).toContain(`DEFAULT_LOGGING_BEACON_PATH = '${LOGGING.beaconPathValue}'`);
      const client = tree.read('features/logger/src/lib/client.ts', 'utf-8');
      expect(client).toContain('NEXT_PUBLIC_LOGGING_BEACON_PATH || DEFAULT_LOGGING_BEACON_PATH');
      expect(client).not.toContain('sendBeacon(NEXT_PUBLIC_LOGGING_BEACON_PATH');
      expect(tree.read('features/logger/src/index.ts', 'utf-8')).toContain("export * from './lib/constants'");
    });

    it('should make the logging env vars optional and only document them in .env.example', async () => {
      await featureGenerator(tree, options);
      const env = tree.read('features/logger/src/lib/config/env.ts', 'utf-8');
      expect(env).toContain('NEXT_PUBLIC_LOGGING_BEACON_PATH: z.string().optional(),');
      expect(env).toContain('LOGGING_SERVICE_NAME: z.string().optional(),');
      const example = tree.read('features/logger/.env.example', 'utf-8');
      expect(example).toContain('NEXT_PUBLIC_LOGGING_BEACON_PATH=/api/log');
      expect(example).toContain('LOGGING_SERVICE_NAME=logger');
      expect(tree.read('features/logger/.env', 'utf-8') ?? '').not.toContain('LOGGING_');
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

    it('should not generate logging or client files', async () => {
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
      expect(content).toContain('CredentialsProvider');
    });

    it('should only export types from the client-safe root index.ts', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/index.ts', 'utf-8') ?? '';
      // authConfig reaches backend.ts (server code): not exported to the client
      expect(content).not.toContain('authConfig');
      expect(content.match(/^export (?!type )/m)).toBeNull();
      expect(content).toContain("export type { AuthError, JWT, Session, User } from './lib/types/next-auth'");
    });

    it('should export the server-only NextAuth instance from server.ts', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/server.ts', 'utf-8');
      expect(content).toContain("export { auth, handlers, signIn, signOut } from './lib/auth'");
    });

    it('should export the server-only getAccessToken() from server.ts', async () => {
      await featureGenerator(tree, options);
      expect(tree.read('features/auth/src/server.ts', 'utf-8')).toContain(
        "export { getAccessToken } from './lib/auth/access-token'"
      );
      const helper = tree.read('features/auth/src/lib/auth/access-token.ts', 'utf-8');
      expect(helper).toMatch(/^import 'server-only';/);
      expect(helper).toContain("import { getToken } from 'next-auth/jwt'");
    });

    it('should keep backend tokens out of the session', async () => {
      await featureGenerator(tree, options);
      const callbacks = tree.read('features/auth/src/lib/auth/callbacks.ts', 'utf-8') ?? '';
      const sessionCallback = callbacks.slice(
        callbacks.indexOf('export const session'),
        callbacks.indexOf('export const redirect')
      );
      expect(sessionCallback).not.toMatch(/accessToken|refreshToken|jwtToken/);
      const types = tree.read('features/auth/src/lib/types/next-auth.d.ts', 'utf-8') ?? '';
      const sessionType = types.slice(types.indexOf('interface Session'), types.indexOf('interface User'));
      expect(sessionType).not.toMatch(/accessToken|refreshToken|jwtToken/);
    });

    it('should refresh expired access tokens in the jwt callback', async () => {
      await featureGenerator(tree, options);
      const callbacks = tree.read('features/auth/src/lib/auth/callbacks.ts', 'utf-8');
      expect(callbacks).toContain('if (isAccessTokenValid(token)) return token;');
      expect(callbacks).toContain('return refreshAccessToken(token);');
      expect(tree.read('features/auth/src/lib/auth/tokens.ts', 'utf-8')).toContain("error: 'RefreshTokenError'");
    });

    it('should make getAccessToken() throw inside the login/refresh backend calls', async () => {
      await featureGenerator(tree, options);
      const tokens = tree.read('features/auth/src/lib/auth/tokens.ts', 'utf-8');
      expect(tokens).toContain("import { AsyncLocalStorage } from 'node:async_hooks';");
      expect(tokens).toContain("runAuthFlow('refresh', () => refresh(refreshToken))");
      expect(tree.read('features/auth/src/lib/auth/index.ts', 'utf-8')).toContain(
        "runAuthFlow('login', () => login(parsed.data, { ip }))"
      );
      const helper = tree.read('features/auth/src/lib/auth/access-token.ts', 'utf-8');
      expect(helper).toContain('const flow = currentAuthFlow();');
      expect(helper).toContain('throw new Error(');
    });

    it('should keep next and node:async_hooks external in the library build', async () => {
      await featureGenerator(tree, options);
      expect(tree.read('features/auth/vite.config.mts', 'utf-8')).toContain(
        "const extraExternals: string[] = ['next', 'node:async_hooks'];"
      );
    });

    it('should reject sessions with a failed refresh in authorized', async () => {
      await featureGenerator(tree, options);
      const callbacks = tree.read('features/auth/src/lib/auth/callbacks.ts', 'utf-8');
      expect(callbacks).toContain('return !!auth?.user && !auth.error;');
    });

    it('should keep the Auth.js cookie defaults', async () => {
      await featureGenerator(tree, options);
      const config = tree.read('features/auth/src/lib/auth/auth.config.ts', 'utf-8');
      expect(config).not.toContain('cookies:');
      expect(config).not.toContain('VERCEL_URL');
    });

    it('should validate credentials and call the backend login stub in authorize()', async () => {
      await featureGenerator(tree, options);
      const content = tree.read('features/auth/src/lib/auth/index.ts', 'utf-8');
      expect(content).toContain('credentialsSchema.safeParse(credentials)');
      expect(content).toContain("await runAuthFlow('login', () => login(parsed.data, { ip }))");
      const backend = tree.read('features/auth/src/lib/auth/backend.ts', 'utf-8');
      expect(backend).toContain('export const credentialsSchema = z.object({');
      expect(backend).toContain('export type BackendCredentials = z.infer<typeof credentialsSchema>;');
      // examples use this library's ApiClient, configured for the feature's API URL
      expect(backend).toContain('npx nx g next-feature:client-config -p auth');
      expect(backend).toContain("api.post<BackendTokens>('/auth/refresh', { refreshToken })");
      expect(backend).toContain('AUTH_API_URL');
    });
  });

  describe('auth name inference', () => {
    it('should infer auth type from name auth', async () => {
      await featureGenerator(tree, { name: 'auth', skipFormat: true });
      expect(tree.exists('features/auth/src/lib/auth/index.ts')).toBeTruthy();
    });
  });

  describe('former base type', () => {
    it('should treat a feature named base as a generic feature', async () => {
      expect(normalizeFeatureGenerator({ name: 'base' }).type).toBe('generic');
      await featureGenerator(tree, { name: 'base', skipFormat: true });
      expect(tree.exists('features/base/src/index.ts')).toBeTruthy();
      expect(tree.exists('features/base/src/components')).toBeFalsy();
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
      const vite = tree.read('features/test/vite.config.mts', 'utf-8');
      expect(vite).toContain('external: isExternal');
      expect(vite).toContain('const extraExternals: string[] = [];');
    });

    it('should externalize and declare axios for client features', async () => {
      await featureGenerator(tree, { name: 'apiClient', type: 'client', skipFormat: true });
      const pkg = readLibPackageJson('apiClient');
      expect(pkg.dependencies).toEqual({ axios: '^1.9.0', 'server-only': '^0.0.1', zod: '^3.24.4' });
      expect(tree.read('features/apiClient/vite.config.mts', 'utf-8')).toContain('external: isExternal');
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

    it('should make next-auth a peer for auth features, externalized through package.json', async () => {
      await featureGenerator(tree, { name: 'auth', type: 'auth', skipFormat: true });
      expect(readLibPackageJson('auth').peerDependencies['next-auth']).toBe('^5.0.0-beta.32');
      const vite = tree.read('features/auth/vite.config.mts', 'utf-8');
      expect(vite).toContain('external: isExternal');
      expect(vite).not.toContain("'next-auth'");
    });

    it('should not hard-code ui dependencies: whatever shadcn installs into package.json stays external', async () => {
      await featureGenerator(tree, { name: 'ui', type: 'ui', skipFormat: true });
      const vite = tree.read('features/ui/vite.config.mts', 'utf-8');
      expect(vite).toContain('external: isExternal');
      expect(vite).toContain("readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8')");
      expect(vite).toContain('...Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })');
    });

    it('should key zod field errors by their full dotted path and path-less issues under FORM_ERROR_KEY', async () => {
      await featureGenerator(tree, { name: 'apiClient', type: 'client', skipFormat: true });
      const zod = tree.read('features/apiClient/src/lib/utils/zod.ts', 'utf-8');
      expect(zod).toContain("export const FORM_ERROR_KEY = '_form';");
      expect(zod).toContain("? issue.path.map(String).join('.')");
      expect(zod).toContain(': FORM_ERROR_KEY;');
      expect(zod).toContain('errors[key] = issue.message;');
    });

    it('should check axios and zod errors by shape, not instanceof, in the client template', async () => {
      await featureGenerator(tree, { name: 'apiClient', type: 'client', skipFormat: true });
      const error = tree.read('features/apiClient/src/lib/utils/error.ts', 'utf-8');
      expect(error).toContain('if (isAxiosError(error)) {');
      expect(error).toContain('if (isZodError(error)) {');
      expect(error).not.toMatch(/instanceof (AxiosError|ZodError)/);
      const zod = tree.read('features/apiClient/src/lib/utils/zod.ts', 'utf-8');
      expect(zod).not.toContain("from 'zod'");
      expect(zod).toContain('zodError.issues.forEach');
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

    it('documents the client-type fallback API URL var in .env.example only, typed optional', async () => {
      await featureGenerator(tree, { name: 'apiClient', type: 'client', skipFormat: true });
      // projects pass their own baseURL from lib/config/client.ts (client-config)
      expect(tree.read('features/apiClient/.env', 'utf-8') ?? '').not.toContain('API_URL');
      expect(tree.read('features/apiClient/.env.example', 'utf-8')).toContain('API_CLIENT_API_URL=');
      const env = tree.read('features/apiClient/src/lib/config/env.ts', 'utf-8');
      expect(env).toContain('API_CLIENT_API_URL: z.string().optional(),');
      expect(tree.read('features/apiClient/src/lib/client.ts', 'utf-8')).toContain('baseURL: API_CLIENT_API_URL');
    });

    it('does not register the API URL var for other feature types', async () => {
      await featureGenerator(tree, { name: 'logger', type: 'logging', skipFormat: true });
      expect(tree.exists('features/logger/src/lib/server.ts')).toBeTruthy();
      const dotenv = tree.read('features/logger/.env', 'utf-8') ?? '';
      expect(dotenv).not.toContain('API_URL');
    });
  });
});

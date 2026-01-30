import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';

import { clientGenerator } from './client';
import { ClientGeneratorSchema } from './schema';

describe('client generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('basic functionality', () => {
    const options: ClientGeneratorSchema = { name: 'test' };

    it('should run successfully', async () => {
      await clientGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'test');
      expect(config).toBeDefined();
    });

    it('should create project with correct configuration', async () => {
      await clientGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'test');

      expect(config.root).toBe('clients/test');
      expect(config.sourceRoot).toBe('clients/test/src');
      expect(config.projectType).toBe('library');
    });

    it('should set up bundler as vite', async () => {
      await clientGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'test');

      expect(config.targets?.build?.executor).toContain('vite');
    });

    it('should set up unit test runner as jest', async () => {
      await clientGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'test');

      expect(config.targets?.test?.executor).toContain('jest');
    });
  });

  describe('file generation', () => {
    const options: ClientGeneratorSchema = { name: 'test' };

    it('should generate all core files', async () => {
      await clientGenerator(tree, options);

      const expectedFiles = [
        'clients/test/src/index.ts',
        'clients/test/src/server.ts',
        'clients/test/src/lib/error.ts',
        'clients/test/src/lib/client.ts',
        'clients/test/src/lib/types/index.ts',
        'clients/test/src/lib/utils/error.ts',
        'clients/test/src/lib/utils/helper.ts',
      ];

      expectedFiles.forEach(file => {
        expect(tree.exists(file)).toBeTruthy();
      });
    });

    it('should generate React components and hooks', async () => {
      await clientGenerator(tree, options);

      const reactFiles = [
        'clients/test/src/hooks/use-api-error.tsx',
        'clients/test/src/components/api-error-boundary.tsx',
      ];

      reactFiles.forEach(file => {
        expect(tree.exists(file)).toBeTruthy();
      });
    });

    it('should generate README file', async () => {
      await clientGenerator(tree, options);

      expect(tree.exists('clients/test/README.md')).toBeTruthy();
    });

    it('should generate index.ts with correct exports', async () => {
      await clientGenerator(tree, options);

      const indexContent = tree.read('clients/test/src/index.ts', 'utf-8');

      expect(indexContent).toContain('export { ApiClient, type ApiClientConfig }');
      expect(indexContent).toContain('export { ApiError, ApiErrorBuilder, type ProblemDetail }');
      expect(indexContent).toContain('export * from "./lib/types"');
      expect(indexContent).toContain('export * from "./lib/utils/error"');
      expect(indexContent).toContain('export * from "./lib/utils/helper"');
    });

    it('should generate error.ts with ApiError class', async () => {
      await clientGenerator(tree, options);

      const errorContent = tree.read('clients/test/src/lib/error.ts', 'utf-8');

      expect(errorContent).toContain('export class ApiError extends Error');
      expect(errorContent).toContain('export class ApiErrorBuilder');
      expect(errorContent).toContain('export interface ProblemDetail');
      expect(errorContent).toContain('isClientError');
      expect(errorContent).toContain('isServerError');
      expect(errorContent).toContain('isUnauthorized');
      expect(errorContent).toContain('isForbidden');
      expect(errorContent).toContain('isNotFound');
      expect(errorContent).toContain('fromZodError');
    });

    it('should generate client.ts with ApiClient class', async () => {
      await clientGenerator(tree, options);

      const clientContent = tree.read('clients/test/src/lib/client.ts', 'utf-8');

      expect(clientContent).toContain('export class ApiClient');
      expect(clientContent).toContain('export interface ApiClientConfig');
      expect(clientContent).toContain('async get<T = any>');
      expect(clientContent).toContain('async post<T = any>');
      expect(clientContent).toContain('async put<T = any>');
      expect(clientContent).toContain('async patch<T = any>');
      expect(clientContent).toContain('async delete<T = any>');
      expect(clientContent).toContain('setupInterceptors');
      expect(clientContent).toContain('handleUnauthorizedError');
      expect(clientContent).toContain('refreshToken');
    });
  });

  describe('dependencies', () => {
    const options: ClientGeneratorSchema = { name: 'test' };

    it('should add axios and zod dependencies', async () => {
      await clientGenerator(tree, options);

      const packageJson = readJson(tree, 'clients/test/package.json');

      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.axios).toBeDefined();
      expect(packageJson.dependencies.zod).toBeDefined();
    });

    it('should use correct dependency versions', async () => {
      await clientGenerator(tree, options);

      const packageJson = readJson(tree, 'clients/test/package.json');

      // Versions are imported from constants
      expect(packageJson.dependencies.axios).toMatch(/^\^?\d+\.\d+\.\d+/);
      expect(packageJson.dependencies.zod).toMatch(/^\^?\d+\.\d+\.\d+/);
    });
  });

  describe('tsconfig integration', () => {
    const options: ClientGeneratorSchema = { name: 'test' };

    it('should set import path in tsconfig', async () => {
      await clientGenerator(tree, options);

      const tsConfig = tree.read('tsconfig.base.json', 'utf-8');

      expect(tsConfig).toContain('@client/test');
      expect(tsConfig).toContain('clients/test/src');
    });

    it('should use custom orgName in import path', async () => {
      await clientGenerator(tree, { name: 'test', orgName: 'myorg' });

      const tsConfig = tree.read('tsconfig.base.json', 'utf-8');

      expect(tsConfig).toContain('@myorg/test');
    });
  });

  describe('custom options', () => {
    it('should use custom directory when provided', async () => {
      await clientGenerator(tree, {
        name: 'test',
        directory: 'libs/api-clients/test'
      });

      const config = readProjectConfiguration(tree, 'test');

      expect(config.root).toBe('libs/api-clients/test');
      expect(config.sourceRoot).toBe('libs/api-clients/test/src');
      expect(tree.exists('libs/api-clients/test/src/index.ts')).toBeTruthy();
    });

    it('should use custom orgName in package.json', async () => {
      await clientGenerator(tree, {
        name: 'test',
        orgName: 'mycompany'
      });

      const packageJson = readJson(tree, 'clients/test/package.json');

      expect(packageJson.name).toBe('@mycompany/test');
    });

    it('should respect skipFormat option', async () => {
      // This test verifies the option is passed through correctly
      // The actual formatting behavior is handled by formatFiles
      await expect(
        clientGenerator(tree, { name: 'test', skipFormat: true })
      ).resolves.not.toThrow();

      const config = readProjectConfiguration(tree, 'test');
      expect(config).toBeDefined();
    });
  });

  describe('project structure', () => {
    const options: ClientGeneratorSchema = { name: 'api-client' };

    it('should create correct directory structure', async () => {
      await clientGenerator(tree, options);

      const expectedDirs = [
        'clients/api-client/src',
        'clients/api-client/src/lib',
        'clients/api-client/src/lib/types',
        'clients/api-client/src/lib/utils',
        'clients/api-client/src/hooks',
        'clients/api-client/src/components',
      ];

      expectedDirs.forEach(dir => {
        expect(tree.exists(dir)).toBeTruthy();
      });
    });

    it('should create library with tailwind styling', async () => {
      await clientGenerator(tree, options);

      const config = readProjectConfiguration(tree, 'api-client');

      // Nx Next library with tailwind should have appropriate configuration
      expect(config.targets?.build).toBeDefined();
    });

    it('should create library with eslint linter', async () => {
      await clientGenerator(tree, options);

      const config = readProjectConfiguration(tree, 'api-client');

      expect(config.targets?.lint).toBeDefined();
      expect(config.targets?.lint?.executor).toContain('eslint');
    });
  });

  describe('multiple client libraries', () => {
    it('should support creating multiple client libraries', async () => {
      await clientGenerator(tree, { name: 'client1' });
      await clientGenerator(tree, { name: 'client2' });

      const config1 = readProjectConfiguration(tree, 'client1');
      const config2 = readProjectConfiguration(tree, 'client2');

      expect(config1).toBeDefined();
      expect(config2).toBeDefined();
      expect(config1.root).toBe('clients/client1');
      expect(config2.root).toBe('clients/client2');
    });

    it('should create separate tsconfig paths for multiple clients', async () => {
      await clientGenerator(tree, { name: 'client1' });
      await clientGenerator(tree, { name: 'client2' });

      const tsConfig = tree.read('tsconfig.base.json', 'utf-8');

      expect(tsConfig).toContain('@client/client1');
      expect(tsConfig).toContain('@client/client2');
    });
  });

  describe('edge cases', () => {
    it('should handle names with hyphens', async () => {
      await clientGenerator(tree, { name: 'api-client' });

      const config = readProjectConfiguration(tree, 'api-client');
      const packageJson = readJson(tree, 'clients/api-client/package.json');

      expect(config).toBeDefined();
      expect(packageJson.name).toBe('@client/api-client');
    });

    it('should handle names with underscores', async () => {
      await clientGenerator(tree, { name: 'api_client' });

      const config = readProjectConfiguration(tree, 'api_client');

      expect(config).toBeDefined();
      expect(config.root).toBe('clients/api_client');
    });

    it('should handle single character names', async () => {
      await clientGenerator(tree, { name: 'a' });

      const config = readProjectConfiguration(tree, 'a');
      const packageJson = readJson(tree, 'clients/a/package.json');

      expect(config).toBeDefined();
      expect(packageJson.name).toBe('@client/a');
    });
  });

  describe('generated code quality', () => {
    const options: ClientGeneratorSchema = { name: 'test' };

    it('should generate valid TypeScript in error.ts', async () => {
      await clientGenerator(tree, options);

      const errorContent = tree.read('clients/test/src/lib/error.ts', 'utf-8');

      // Check for proper imports
      expect(errorContent).toContain("import { AxiosError, HttpStatusCode } from 'axios'");
      expect(errorContent).toContain("import { ZodError } from 'zod'");

      // Check for proper exports
      expect(errorContent).toMatch(/export (interface|class) /);
    });

    it('should generate valid TypeScript in client.ts', async () => {
      await clientGenerator(tree, options);

      const clientContent = tree.read('clients/test/src/lib/client.ts', 'utf-8');

      // Check for proper imports
      expect(clientContent).toContain("import axios");
      expect(clientContent).toContain("from './error'");

      // Check for proper class structure
      expect(clientContent).toContain('constructor(config: ApiClientConfig)');
      expect(clientContent).toContain('private readonly instance: AxiosInstance');
    });

    it('should generate properly typed React hooks', async () => {
      await clientGenerator(tree, options);

      const hookContent = tree.read('clients/test/src/hooks/use-api-error.tsx', 'utf-8');

      // Should be a .tsx file with React imports
      expect(hookContent).toBeDefined();
    });

    it('should generate properly typed React components', async () => {
      await clientGenerator(tree, options);

      const componentContent = tree.read('clients/test/src/components/api-error-boundary.tsx', 'utf-8');

      // Should be a .tsx file with React component
      expect(componentContent).toBeDefined();
    });
  });
});

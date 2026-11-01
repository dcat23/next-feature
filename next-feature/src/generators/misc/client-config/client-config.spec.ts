import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson, readNxJson, readProjectConfiguration, Tree } from '@nx/devkit';
import { clientConfigGenerator } from './client-config';
import { featureGenerator } from '../../project/feature/feature';
import { applicationGenerator } from '../../project/application/application';

describe('client-config generator', () => {
  let tree: Tree;
  const read = (file: string) => tree.read(file, 'utf-8') ?? '';
  const config = 'features/orders/src/lib/config/client.ts';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should create a missing project as a feature library (#27)', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    expect(readProjectConfiguration(tree, 'orders').root).toBe('features/orders');
    expect(tree.exists(config)).toBeTruthy();
    expect(readNxJson(tree)?.generators?.['next-feature']?.['client-config']?.projectName).toBe('orders');
  });

  it('should throw without a projectName', async () => {
    await expect(clientConfigGenerator(tree, { skipFormat: true } as never)).rejects.toThrow('projectName is required');
  });

  it('should write a server-only default client named api', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    const content = read(config);
    expect(content.startsWith("import 'server-only';")).toBeTruthy();
    expect(content).toContain("import { ApiClient } from '@next-feature/client/server';");
    expect(content).toContain("import { ORDERS_API_URL } from './env';");
    expect(content).toContain('export const api = new ApiClient({');
    expect(content).toContain('baseURL: ORDERS_API_URL,');
    expect(content).toContain('export default api;');
  });

  it('should register the default client env var as <PROJECT>_API_URL', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    expect(read('features/orders/.env')).toContain('### CLIENT ###');
    expect(read('features/orders/.env')).toContain('ORDERS_API_URL=http://localhost:8080');
    expect(read('features/orders/.env.example')).toContain('ORDERS_API_URL=');
    expect(read('features/orders/src/lib/config/env.ts')).toContain('ORDERS_API_URL: z.string(),');
  });

  it('should append further clients as named exports and keep the default', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    await clientConfigGenerator(tree, { projectName: 'orders', name: 'payments', skipFormat: true });
    const content = read(config);
    expect(content).toContain("import { ORDERS_API_URL, PAYMENTS_API_URL } from './env';");
    expect(content).toContain('export const payments = new ApiClient({');
    expect(content).toContain('baseURL: PAYMENTS_API_URL,');
    expect(content.match(/^export default /gm)).toEqual(['export default ']);
    expect(content).toContain('export default api;');
    expect(read('features/orders/.env')).toContain('PAYMENTS_API_URL=http://localhost:8080');
  });

  it('should make the first client the default export, whatever its name', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', name: 'payments', skipFormat: true });
    expect(read(config)).toContain('export default payments;');
  });

  it('should honour envVar', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', name: 'search', envVar: 'algolia_url', skipFormat: true });
    expect(read(config)).toContain('baseURL: ALGOLIA_URL,');
    expect(read('features/orders/.env')).toContain('ALGOLIA_URL=');
  });

  it('should be idempotent', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    await clientConfigGenerator(tree, { projectName: 'orders', name: 'payments', skipFormat: true });
    const before = read(config);
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    await clientConfigGenerator(tree, { projectName: 'orders', name: 'payments', skipFormat: true });
    expect(read(config)).toBe(before);
    expect(read('features/orders/.env').match(/PAYMENTS_API_URL=/g)).toHaveLength(1);
  });

  it('should treat an existing single-client config from earlier versions as the default client', async () => {
    await featureGenerator(tree, { name: 'orders', skipFormat: true });
    const legacy = [
      "import 'server-only';",
      "import { ApiClient } from '@next-feature/client/server';",
      'import { ORDERS_API_URL } from "./env"',
      'const apiClient = new ApiClient({ baseURL: ORDERS_API_URL });',
      'export default apiClient;',
      '',
    ].join('\n');
    tree.write(config, legacy);

    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    expect(read(config)).toBe(legacy);

    await clientConfigGenerator(tree, { projectName: 'orders', name: 'payments', skipFormat: true });
    const content = read(config);
    expect(content).toContain('export default apiClient;');
    expect(content).toContain('export const payments = new ApiClient({');
    expect(content).toMatch(/import \{ ORDERS_API_URL, PAYMENTS_API_URL \} from '.\/env';/);
  });

  it('should not duplicate an env var already defined in another section', async () => {
    await featureGenerator(tree, { name: 'orders', skipFormat: true });
    tree.write('features/orders/.env', '### AXIOS ###\nORDERS_API_URL=https://api.example.com\n');
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    const dotenv = read('features/orders/.env');
    expect(dotenv.match(/ORDERS_API_URL=/g)).toHaveLength(1);
    expect(dotenv).toContain('ORDERS_API_URL=https://api.example.com');
  });

  it('should not read package.json at runtime or force a JSON content type', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    const content = read(config);
    expect(content).not.toContain('require(');
    expect(content).not.toContain('Content-Type');
    expect(content).toContain("userAgent: 'orders',");
    expect(content).not.toContain('axios.defaults');
    // server-only file: client components import these from the client package
    expect(content).not.toContain('export { ApiError');
  });

  it('should export the clients from server.ts when export is set on a library', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', export: true, skipFormat: true });
    expect(read('features/orders/src/server.ts')).toContain("export * from './lib/config/client';");
    expect(read('features/orders/src/index.ts')).not.toContain('config/client');
  });

  it('should add @next-feature/client as a dependency', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    expect(readJson(tree, 'package.json').dependencies?.['@next-feature/client']).toBeDefined();
  });

  it('should declare @next-feature/client in a feature library so its build keeps it external', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    const dependencies = readJson(tree, 'features/orders/package.json').dependencies;
    expect(dependencies?.['@next-feature/client']).toMatch(/^\^/);
    expect(dependencies?.['server-only']).toBeDefined();
  });

  it('should declare the dependency when re-run on a library that already has a client', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    tree.write('features/orders/package.json', JSON.stringify({ name: '@feature/orders', dependencies: {} }));
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    expect(readJson(tree, 'features/orders/package.json').dependencies?.['@next-feature/client']).toBeDefined();
  });

  it('should not declare a custom clientPackage it has no version for', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', clientPackage: '@myorg/http', skipFormat: true });
    const dependencies = readJson(tree, 'features/orders/package.json').dependencies ?? {};
    expect(dependencies['@myorg/http']).toBeUndefined();
    expect(dependencies['@next-feature/client']).toBeUndefined();
    expect(read(config)).toContain("from '@myorg/http/server'");
  });

  it('should not touch an application package.json', async () => {
    await applicationGenerator(tree, { name: 'web', skipLogging: true, skipFormat: true });
    await clientConfigGenerator(tree, { projectName: 'web', skipFormat: true });
    expect(readJson(tree, 'apps/web/package.json').dependencies?.['@next-feature/client']).toBeUndefined();
  });

  it('should ignore the deprecated baseUrl and includeInterceptors options', async () => {
    await clientConfigGenerator(tree, { projectName: 'orders', skipFormat: true });
    const expected = read(config).replace(/\* .*(am|pm)\n/g, '');
    tree.delete(config);
    await clientConfigGenerator(tree, {
      projectName: 'orders',
      baseUrl: "'https://api.example.com'",
      includeInterceptors: false,
      skipFormat: true,
    });
    expect(read(config).replace(/\* .*(am|pm)\n/g, '')).toBe(expected);
  });

  it('should work in an application without a src directory', async () => {
    await applicationGenerator(tree, { name: 'web', skipLogging: true, skipFormat: true });
    await clientConfigGenerator(tree, { projectName: 'web', skipFormat: true });
    const content = read('apps/web/lib/config/client.ts');
    expect(content).toContain('baseURL: WEB_API_URL,');
    expect(content).not.toContain('package.json');
    expect(read('apps/web/.env')).toContain('WEB_API_URL=');
  });
});

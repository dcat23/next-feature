import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { getPackageManagerVersion, logger, readJson, Tree, updateJson, updateProjectConfiguration, readProjectConfiguration } from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
import { applicationGenerator } from '../../project/application/application';
import { NX_IGNORE_VERSION } from '../../../lib/constants/versions';
import { vercelEnvKeys, vercelGenerator } from './vercel';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  getPackageManagerVersion: jest.fn(() => '11.9.0'),
}));

jest.mock('../../../lib/utils/shadcn', () => ({
  ...jest.requireActual('../../../lib/utils/shadcn'),
  installShadcnBaseTask: jest.fn(() => jest.fn()),
}));

describe('vercel generator', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('pnpm-lock.yaml', '');
    await applicationGenerator(tree, { name: 'web', skipLogging: true, skipFormat: true });
  });

  const vercelJson = () => readJson(tree, 'apps/web/vercel.json');

  it('installs at the workspace root, builds with Nx and points Vercel at the Nx output', async () => {
    await vercelGenerator(tree, { projectName: 'web', skipFormat: true });
    expect(vercelJson()).toEqual({
      $schema: 'https://openapi.vercel.sh/vercel.json',
      framework: 'nextjs',
      installCommand: 'cd ../.. && npx -y pnpm@11.9.0 install --frozen-lockfile',
      buildCommand: 'cd ../.. && npx nx build web',
      outputDirectory: '../../dist/apps/web/.next',
      ignoreCommand: `cd ../.. && pnpm_config_strict_dep_builds=false npx -y nx-ignore@${NX_IGNORE_VERSION} web`,
    });
  });

  it('uses the package.json packageManager version', async () => {
    updateJson(tree, 'package.json', (json) => ({ ...json, packageManager: 'pnpm@10.4.1+sha512.abc' }));
    await vercelGenerator(tree, { projectName: 'web', skipFormat: true });
    expect(vercelJson().installCommand).toBe('cd ../.. && npx -y pnpm@10.4.1 install --frozen-lockfile');
  });

  it('supports npm workspaces', async () => {
    tree.delete('pnpm-lock.yaml');
    tree.write('package-lock.json', '{}');
    await vercelGenerator(tree, { projectName: 'web', skipFormat: true });
    expect(vercelJson().installCommand).toBe('cd ../.. && npm ci');
    expect(vercelJson().ignoreCommand).toBe(`cd ../.. && npx -y nx-ignore@${NX_IGNORE_VERSION} web`);
  });

  it('supports yarn workspaces', async () => {
    tree.delete('pnpm-lock.yaml');
    tree.write('yarn.lock', '');
    (getPackageManagerVersion as jest.Mock).mockReturnValueOnce('4.5.0');
    await vercelGenerator(tree, { projectName: 'web', skipFormat: true });
    expect(vercelJson().installCommand).toMatch(/^cd \.\.\/\.\. && yarn install/);
  });

  it('uses .next in the app when the build has no separate outputPath (inferred targets)', async () => {
    const project = readProjectConfiguration(tree, 'web');
    delete project.targets?.build;
    updateProjectConfiguration(tree, 'web', project);
    await vercelGenerator(tree, { projectName: 'web', skipFormat: true });
    expect(vercelJson().outputDirectory).toBe('.next');
  });

  it('omits the ignore step with ignoreUnaffected: false', async () => {
    await vercelGenerator(tree, { projectName: 'web', skipFormat: true });
    await vercelGenerator(tree, { projectName: 'web', ignoreUnaffected: false, skipFormat: true });
    expect(vercelJson().ignoreCommand).toBeUndefined();
  });

  it('keeps other keys in an existing vercel.json', async () => {
    tree.write('apps/web/vercel.json', JSON.stringify({ crons: [{ path: '/api/cron', schedule: '0 5 * * *' }], buildCommand: 'old' }));
    await vercelGenerator(tree, { projectName: 'web', skipFormat: true });
    expect(vercelJson().crons).toEqual([{ path: '/api/cron', schedule: '0 5 * * *' }]);
    expect(vercelJson().buildCommand).toBe('cd ../.. && npx nx build web');
  });

  it('gitignores .vercel', async () => {
    await vercelGenerator(tree, { projectName: 'web', skipFormat: true });
    expect(tree.read('.gitignore', 'utf-8')?.split('\n')).toContain('.vercel');
  });

  it('lists the env vars to set in Vercel, without the Auth.js URL', async () => {
    await applicationGenerator(tree, { name: 'portal', useAuth: true, skipLogging: true, skipFormat: true });
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    await vercelGenerator(tree, { projectName: 'portal', skipFormat: true });
    const message = info.mock.calls.map(([line]) => String(line)).join('\n');
    info.mockRestore();
    expect(message).toContain('set Root Directory to apps/portal');
    expect(message).toMatch(/Environment variables to add[^\n]*AUTH_SECRET/);
    expect(message).not.toMatch(/Environment variables to add[^\n]*NEXTAUTH_URL/);
  });

  it('separates optional overrides that only appear in .env.example', async () => {
    tree.write('apps/web/.env', 'WEB_API_URL=http://localhost:8080\nNEXTAUTH_URL=http://localhost:4200\n');
    tree.write('apps/web/.env.example', 'WEB_API_URL=\nLOGGING_SERVICE_NAME=\n');
    expect(vercelEnvKeys(tree, 'apps/web')).toEqual({ required: ['WEB_API_URL'], optional: ['LOGGING_SERVICE_NAME'] });
  });

  it('rejects projects that are not Next.js applications', async () => {
    await libraryGenerator(tree, { directory: 'libs/util', name: 'util', skipFormat: true } as never);
    await expect(vercelGenerator(tree, { projectName: 'util', skipFormat: true })).rejects.toThrow(
      "isn't a Next.js application"
    );
  });
});

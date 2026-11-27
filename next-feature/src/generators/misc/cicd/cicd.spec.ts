import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson, Tree, updateJson } from '@nx/devkit';
import { parse } from 'yaml';
import { applicationGenerator } from '../../project/application/application';
import { GITHUB_ACTIONS, VERCEL_CLI_VERSION } from '../../../lib/constants/versions';
import { cicdGenerator, vercelProjectIdSecret } from './cicd';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  getPackageManagerVersion: jest.fn(() => '11.9.0'),
}));

jest.mock('../../../lib/utils/shadcn', () => ({
  ...jest.requireActual('../../../lib/utils/shadcn'),
  installShadcnBaseTask: jest.fn(() => jest.fn()),
}));

type Step = { uses?: string; run?: string; with?: Record<string, unknown>; if?: string; id?: string };
type Workflow = {
  name: string;
  on: Record<string, unknown>;
  env: Record<string, unknown>;
  permissions: Record<string, string>;
  jobs: Record<string, { if?: string; needs?: string; steps: Step[] }>;
};

describe('cicd generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('pnpm-lock.yaml', '');
  });

  const workflow = (file: string): Workflow => parse(tree.read(`.github/workflows/${file}`, 'utf-8') ?? '');
  const steps = (file: string, job: string) => workflow(file).jobs[job].steps;
  const runs = (file: string, job: string) => steps(file, job).flatMap((step) => (step.run ? [step.run] : []));

  describe('ci.yml', () => {
    it('lints, tests and builds the affected projects on pull requests and main', async () => {
      await cicdGenerator(tree, { skipFormat: true });
      const ci = workflow('ci.yml');
      expect(ci.name).toBe('CI');
      expect(Object.keys(ci.on)).toEqual(['pull_request', 'push', 'workflow_dispatch']);
      expect(ci.on['push']).toEqual({ branches: ['main'] });
      expect(ci.permissions).toEqual({ contents: 'read', actions: 'read' });
      expect(ci.env).toEqual({ NX_DAEMON: false, NX_TUI: false, NX_NO_CLOUD: true });
      expect(steps('ci.yml', 'main')).toEqual([
        { uses: GITHUB_ACTIONS.checkout, with: { 'fetch-depth': 0 } },
        { uses: GITHUB_ACTIONS.setupPnpm, with: { version: '11.9.0' } },
        { uses: GITHUB_ACTIONS.setupNode, with: { 'node-version-file': '.nvmrc', cache: 'pnpm' } },
        { run: 'pnpm install --frozen-lockfile' },
        { uses: GITHUB_ACTIONS.nxSetShas },
        { run: 'pnpm exec nx affected -t lint test build' },
      ]);
      expect(Object.keys(ci.jobs)).toEqual(['main']);
    });

    it('creates .nvmrc with the current Node major, keeping an existing version file', async () => {
      await cicdGenerator(tree, { skipFormat: true });
      expect(tree.read('.nvmrc', 'utf-8')).toBe(`${process.versions.node.split('.')[0]}\n`);

      tree.delete('.nvmrc');
      tree.write('.node-version', '22.11.0\n');
      await cicdGenerator(tree, { skipFormat: true });
      expect(tree.exists('.nvmrc')).toBe(false);
      expect(steps('ci.yml', 'main')[2].with).toEqual({ 'node-version-file': '.node-version', cache: 'pnpm' });
    });

    it('lets pnpm/action-setup read package.json packageManager', async () => {
      updateJson(tree, 'package.json', (json) => ({ ...json, packageManager: 'pnpm@10.4.1' }));
      await cicdGenerator(tree, { skipFormat: true });
      // both a version input and packageManager make pnpm/action-setup fail
      expect(steps('ci.yml', 'main')[1]).toEqual({ uses: GITHUB_ACTIONS.setupPnpm });
    });

    it('supports npm, yarn and bun workspaces', async () => {
      tree.delete('pnpm-lock.yaml');
      tree.write('package-lock.json', '{}');
      await cicdGenerator(tree, { skipFormat: true });
      expect(steps('ci.yml', 'main').map((step) => step.uses ?? step.run)).toEqual([
        GITHUB_ACTIONS.checkout,
        GITHUB_ACTIONS.setupNode,
        'npm ci',
        GITHUB_ACTIONS.nxSetShas,
        'npx nx affected -t lint test build',
      ]);

      tree.delete('package-lock.json');
      tree.write('yarn.lock', '');
      await cicdGenerator(tree, { skipFormat: true });
      expect(steps('ci.yml', 'main')[1]).toEqual({ run: 'corepack enable' });
      expect(steps('ci.yml', 'main')[2].with).toMatchObject({ cache: 'yarn' });
      expect(runs('ci.yml', 'main')).toContain('yarn nx affected -t lint test build');

      tree.delete('yarn.lock');
      tree.write('bun.lock', '');
      await cicdGenerator(tree, { skipFormat: true });
      expect(steps('ci.yml', 'main')[1]).toEqual({ uses: GITHUB_ACTIONS.setupBun, with: { 'bun-version': '11.9.0' } });
      expect(steps('ci.yml', 'main')[2].with).toEqual({ 'node-version-file': '.nvmrc' });
      expect(runs('ci.yml', 'main')).toEqual(['bun install --frozen-lockfile', 'bunx nx affected -t lint test build']);
    });

    it("uses nx.json's defaultBase and keeps Nx Cloud for connected workspaces", async () => {
      updateJson(tree, 'nx.json', (json) => ({ ...json, defaultBase: 'develop', nxCloudId: 'abc' }));
      await cicdGenerator(tree, { skipFormat: true });
      const ci = workflow('ci.yml');
      expect(ci.on['push']).toEqual({ branches: ['develop'] });
      expect(ci.env).not.toHaveProperty('NX_NO_CLOUD');
      expect(steps('ci.yml', 'main')[4]).toEqual({
        uses: GITHUB_ACTIONS.nxSetShas,
        with: { 'main-branch-name': 'develop' },
      });
    });

    it('adds an e2e job when e2e is set', async () => {
      await cicdGenerator(tree, { e2e: true, skipFormat: true });
      const ci = workflow('ci.yml');
      expect(ci.jobs['e2e'].needs).toBe('main');
      expect(runs('ci.yml', 'e2e')).toContain('pnpm exec nx affected -t e2e');
    });

    it('writes no deploy workflows or Dependabot config by default', async () => {
      await cicdGenerator(tree, { skipFormat: true });
      expect(tree.children('.github/workflows')).toEqual(['ci.yml']);
      expect(tree.exists('.github/dependabot.yml')).toBe(false);
    });
  });

  describe('deploy workflows', () => {
    beforeEach(async () => {
      await applicationGenerator(tree, { name: 'web', skipLogging: true, skipFormat: true });
    });

    it('builds and pushes the Docker image after CI passes on main, when the app is affected', async () => {
      await cicdGenerator(tree, { docker: ['web'], skipFormat: true });
      expect(tree.exists('apps/web/Dockerfile')).toBe(true);

      const deploy = workflow('deploy-web-docker.yml');
      expect(deploy.on['workflow_run']).toEqual({ workflows: ['CI'], types: ['completed'], branches: ['main'] });
      expect(deploy.permissions).toEqual({ contents: 'read', actions: 'read', packages: 'write' });
      // pull requests from a branch named main also trigger workflow_run
      expect(deploy.jobs['deploy'].if).toContain("github.event.workflow_run.event == 'push'");
      expect(deploy.jobs['deploy'].if).toContain("github.event.workflow_run.conclusion == 'success'");

      const jobSteps = steps('deploy-web-docker.yml', 'deploy');
      expect(jobSteps[0].with).toEqual({ ref: '${{ github.event.workflow_run.head_sha || github.sha }}', 'fetch-depth': 0 });
      expect(jobSteps.find((step) => step.uses === GITHUB_ACTIONS.nxSetShas)?.with).toEqual({
        'main-branch-name': 'main',
        'last-successful-event': 'workflow_run',
      });
      expect(jobSteps.find((step) => step.id === 'affected')?.run).toContain(
        "pnpm exec nx show projects --affected --projects=web | grep -x 'web' > /dev/null"
      );
      expect(jobSteps.find((step) => step.id === 'meta')?.with).toMatchObject({
        context: 'git',
        images: 'ghcr.io/${{ github.repository }}/web',
      });
      expect(jobSteps.find((step) => step.uses === GITHUB_ACTIONS.dockerBuildPush)).toMatchObject({
        if: "steps.affected.outputs.deploy == 'true'",
        with: { context: '.', file: 'apps/web/Dockerfile', push: true },
      });
    });

    it('keeps an existing Dockerfile', async () => {
      tree.write('apps/web/Dockerfile', 'FROM scratch\n');
      await cicdGenerator(tree, { docker: ['web'], skipFormat: true });
      expect(tree.read('apps/web/Dockerfile', 'utf-8')).toBe('FROM scratch\n');
    });

    it('deploys prebuilt output with the Vercel CLI and disables Git deployments', async () => {
      await cicdGenerator(tree, { vercel: ['web'], skipFormat: true });
      const config = readJson(tree, 'apps/web/vercel.json');
      expect(config.buildCommand).toBe('cd ../.. && npx nx build web');
      expect(config.git).toEqual({ deploymentEnabled: false });

      const deploy = workflow('deploy-web-vercel.yml');
      expect(Object.keys(deploy.on)).toEqual(['workflow_run', 'pull_request', 'workflow_dispatch']);
      expect(deploy.env).toMatchObject({
        VERCEL_ORG_ID: '${{ secrets.VERCEL_ORG_ID }}',
        VERCEL_PROJECT_ID: '${{ secrets.VERCEL_WEB_PROJECT_ID }}',
      });
      // no secrets for forks and Dependabot
      expect(deploy.jobs['deploy'].if).toContain('github.event.pull_request.head.repo.full_name == github.repository');
      expect(deploy.jobs['deploy'].if).toContain("github.actor != 'dependabot[bot]'");

      const script = steps('deploy-web-vercel.yml', 'deploy').find((step) => step.id === 'deploy')?.run;
      const cli = `npx -y vercel@${VERCEL_CLI_VERSION}`;
      expect(script).toContain(`${cli} pull --yes --environment="$environment"`);
      expect(script).toContain(`${cli} build $prod`);
      expect(script).toContain(`${cli} deploy --prebuilt $prod`);
    });

    it('keeps the other keys of an existing vercel.json', async () => {
      tree.write('apps/web/vercel.json', JSON.stringify({ crons: [], git: { deploymentEnabled: { main: true } } }));
      await cicdGenerator(tree, { vercel: ['web'], skipFormat: true });
      expect(readJson(tree, 'apps/web/vercel.json')).toEqual({ crons: [], git: { deploymentEnabled: false } });
    });

    it('accepts comma-separated app lists and names one secret per Vercel project', async () => {
      await applicationGenerator(tree, { name: 'admin-portal', skipLogging: true, skipFormat: true });
      await cicdGenerator(tree, { vercel: 'web, admin-portal' as unknown as string[], skipFormat: true });
      expect(tree.exists('.github/workflows/deploy-web-vercel.yml')).toBe(true);
      expect(workflow('deploy-admin-portal-vercel.yml').env['VERCEL_PROJECT_ID']).toBe(
        '${{ secrets.VERCEL_ADMIN_PORTAL_PROJECT_ID }}'
      );
      expect(vercelProjectIdSecret('admin-portal')).toBe('VERCEL_ADMIN_PORTAL_PROJECT_ID');
    });

    it('rejects projects that are not Next.js applications', async () => {
      await expect(cicdGenerator(tree, { docker: ['missing'], skipFormat: true })).rejects.toThrow();
    });
  });

  describe('dependabot', () => {
    it('updates packages except Nx, and GitHub Actions, weekly', async () => {
      await cicdGenerator(tree, { dependencyUpdates: 'dependabot', skipFormat: true });
      const config = parse(tree.read('.github/dependabot.yml', 'utf-8') ?? '');
      expect(config.version).toBe(2);
      expect(config.updates.map((update: { 'package-ecosystem': string }) => update['package-ecosystem'])).toEqual([
        'npm',
        'github-actions',
      ]);
      expect(config.updates[0].ignore).toEqual([{ 'dependency-name': 'nx' }, { 'dependency-name': '@nx/*' }]);
    });
  });

  it('formats the generated YAML without changing it', async () => {
    await cicdGenerator(tree, { docker: [], dependencyUpdates: 'dependabot' });
    expect(workflow('ci.yml').name).toBe('CI');
    expect(parse(tree.read('.github/dependabot.yml', 'utf-8') ?? '').version).toBe(2);
  });
});

import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  logger,
  names,
  type PackageManager,
  readJson,
  readNxJson,
  readProjectConfiguration,
  Tree,
  writeJson,
} from '@nx/devkit';
import * as path from 'path';
import { GITHUB_ACTIONS, VERCEL_CLI_VERSION } from '../../../lib/constants/versions';
import {
  execCommand,
  frozenInstallCommand,
  NODE_VERSION_FILES,
  type PackageManagerSetup,
  resolveNodeVersion,
  resolvePackageManager,
} from '../../../lib/utils/package-manager';
import { dockerGenerator } from '../docker/docker';
import { vercelGenerator } from '../vercel/vercel';
import type { CicdGeneratorSchema } from './schema';

export const WORKFLOWS_DIR = '.github/workflows';
/** The CI workflow's `name:`, which the deploy workflows wait for (workflow_run) */
export const CI_WORKFLOW_NAME = 'CI';
/** Targets the CI workflow runs on affected projects */
export const CI_TARGETS = ['lint', 'test', 'build'];

/** setup-node's built-in dependency caches */
const NODE_CACHE: Partial<Record<PackageManager, string>> = { pnpm: 'pnpm', npm: 'npm', yarn: 'yarn' };

/** `secrets.VERCEL_<APP>_PROJECT_ID`: one Vercel project per app, shared token and team */
export function vercelProjectIdSecret(projectName: string): string {
  return `VERCEL_${names(projectName).constantName}_PROJECT_ID`;
}

/**
 * Steps that install the toolchain and the workspace's dependencies, as YAML
 * list items at the indentation of a job's `steps:`. The package manager
 * version comes from package.json `packageManager` when set (pnpm/action-setup
 * and corepack read it; giving both makes pnpm/action-setup fail), else the
 * version found at generation time.
 */
export function setupSteps(tree: Tree, { packageManager, version }: PackageManagerSetup, nodeVersionFile: string) {
  const hasField = !!(tree.exists('package.json') && readJson(tree, 'package.json').packageManager);
  const steps: string[] = [];

  if (packageManager === 'pnpm') {
    steps.push(
      hasField || !version
        ? `- uses: ${GITHUB_ACTIONS.setupPnpm}`
        : `- uses: ${GITHUB_ACTIONS.setupPnpm}\n  with:\n    version: ${version}`
    );
  } else if (packageManager === 'yarn') {
    // setup-node's yarn cache runs yarn, so corepack comes first
    steps.push(`- run: corepack enable`);
  } else if (packageManager === 'bun') {
    steps.push(
      hasField || !version
        ? `- uses: ${GITHUB_ACTIONS.setupBun}${hasField ? '\n  with:\n    bun-version-file: package.json' : ''}`
        : `- uses: ${GITHUB_ACTIONS.setupBun}\n  with:\n    bun-version: ${version}`
    );
  }

  const cache = NODE_CACHE[packageManager];
  steps.push(
    `- uses: ${GITHUB_ACTIONS.setupNode}\n  with:\n    node-version-file: ${nodeVersionFile}${cache ? `\n    cache: ${cache}` : ''}`
  );
  steps.push(`- run: ${frozenInstallCommand(packageManager, tree.root)}`);

  return steps.map((step) => step.replace(/^/gm, '      ')).join('\n');
}

/** .nvmrc / .node-version, created as .nvmrc with the current Node major when neither exists */
function ensureNodeVersionFile(tree: Tree): string {
  const existing = NODE_VERSION_FILES.find((file) => tree.exists(file));
  if (existing) return existing;
  tree.write('.nvmrc', `${resolveNodeVersion(tree)}\n`);
  return '.nvmrc';
}

/** Branch nx affected compares against: nx.json `defaultBase`, else main */
function mainBranch(tree: Tree): string {
  const nxJson = readNxJson(tree) as { defaultBase?: string; affected?: { defaultBase?: string } } | null;
  return nxJson?.defaultBase ?? nxJson?.affected?.defaultBase ?? 'main';
}

/** Connected workspaces keep remote caching; others skip the Nx Cloud lookup */
function usesNxCloud(tree: Tree): boolean {
  const nxJson = readNxJson(tree) as { nxCloudId?: string; nxCloudAccessToken?: string } | null;
  return !!(nxJson?.nxCloudId || nxJson?.nxCloudAccessToken);
}

/**
 * The CLI deploys replace Vercel's Git integration, which would otherwise
 * deploy every commit a second time (and run the vercel.json ignore step).
 */
function disableVercelGitDeployments(tree: Tree, projectRoot: string) {
  const file = joinPathFragments(projectRoot, 'vercel.json');
  const config = readJson(tree, file);
  writeJson(tree, file, { ...config, git: { ...(config.git ?? {}), deploymentEnabled: false } });
}

function uniqueProjects(projects: string[] | string | undefined): string[] {
  const list = typeof projects === 'string' ? projects.split(',') : (projects ?? []);
  return [...new Set(list.map((project) => project.trim()).filter(Boolean))];
}

export async function cicdGenerator(tree: Tree, options: CicdGeneratorSchema = {}) {
  const docker = uniqueProjects(options.docker);
  const vercel = uniqueProjects(options.vercel);
  const dependencyUpdates = options.dependencyUpdates ?? 'none';

  const packageManager = resolvePackageManager(tree);
  if (!packageManager.version && ['pnpm', 'bun'].includes(packageManager.packageManager)) {
    logger.warn(
      `cicd: couldn't detect the ${packageManager.packageManager} version; set package.json "packageManager" so CI installs the version that wrote the lockfile`
    );
  }

  const nodeVersionFile = ensureNodeVersionFile(tree);
  const variables = {
    tmpl: '',
    ciWorkflow: CI_WORKFLOW_NAME,
    ciTargets: CI_TARGETS.join(' '),
    mainBranch: mainBranch(tree),
    noCloud: !usesNxCloud(tree),
    e2e: !!options.e2e,
    nx: `${execCommand(packageManager.packageManager)} nx`,
    setupSteps: setupSteps(tree, packageManager, nodeVersionFile),
    actions: GITHUB_ACTIONS,
  };

  generateFiles(tree, path.join(__dirname, 'files', 'ci'), WORKFLOWS_DIR, variables);

  for (const projectName of docker) {
    const { root } = readProjectConfiguration(tree, projectName);
    if (!tree.exists(joinPathFragments(root, 'Dockerfile'))) {
      await dockerGenerator(tree, { projectName, skipFormat: true });
    }
    generateFiles(tree, path.join(__dirname, 'files', 'docker'), WORKFLOWS_DIR, {
      ...variables,
      projectName,
      dockerfile: joinPathFragments(root, 'Dockerfile'),
    });
  }

  for (const projectName of vercel) {
    const { root } = readProjectConfiguration(tree, projectName);
    if (!tree.exists(joinPathFragments(root, 'vercel.json'))) {
      await vercelGenerator(tree, { projectName, skipFormat: true });
    }
    disableVercelGitDeployments(tree, root);
    generateFiles(tree, path.join(__dirname, 'files', 'vercel'), WORKFLOWS_DIR, {
      ...variables,
      projectName,
      projectIdSecret: vercelProjectIdSecret(projectName),
      vercelCli: `vercel@${VERCEL_CLI_VERSION}`,
    });
  }

  if (dependencyUpdates === 'dependabot') {
    generateFiles(tree, path.join(__dirname, 'files', 'dependabot'), '.github', {
      ...variables,
      ecosystem: packageManager.packageManager === 'bun' ? 'bun' : 'npm',
    });
  }

  const notes = [`cicd: ${WORKFLOWS_DIR}/ci.yml runs \`nx affected -t ${variables.ciTargets}\` on pull requests and ${variables.mainBranch}.`];
  if (docker.length) {
    notes.push(
      `Docker deploys push ghcr.io/<owner>/<repo>/<app> with GITHUB_TOKEN (no secrets needed): ${docker.join(', ')}. New GHCR packages are private.`
    );
  }
  if (vercel.length) {
    notes.push(
      `Vercel deploys need the repository secrets VERCEL_TOKEN, VERCEL_ORG_ID and ${vercel.map(vercelProjectIdSecret).join(', ')} (from \`vercel link\`, .vercel/project.json). vercel.json now disables Vercel's Git deployments.`
    );
  }
  logger.info(notes.join('\n'));

  if (!options.skipFormat) await formatFiles(tree);
}

export default cicdGenerator;

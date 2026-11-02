import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  logger,
  type PackageManager,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';
import { enableStandaloneOutput, STANDALONE_OUTPUT_ENV } from '../../../lib/utils/next-config';
import {
  frozenInstallCommand,
  type PackageManagerSetup,
  resolvePackageManager,
} from '../../../lib/utils/package-manager';
import type { DockerGeneratorSchema } from './schema';

export { resolvePackageManager };

const NEXT_CONFIG_FILES = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
const COMPOSE_FILES = ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml'];
const CONTAINER_PORT = 3000;

/** Package manager caches mounted during install, so rebuilds reuse downloads */
const CACHE_MOUNTS: Partial<Record<PackageManager, string>> = {
  pnpm: '/root/.local/share/pnpm/store',
  npm: '/root/.npm',
};

/** Workspace-wide: secrets and build output never enter the build context */
export const DOCKERIGNORE_ENTRIES = [
  '.git',
  '**/node_modules',
  'dist',
  'tmp',
  '.nx',
  '**/.next',
  'coverage',
  '*.log',
  '**/.env',
  '**/.env.*',
  '!**/.env.example',
];

function dockerCommands({ packageManager, version }: PackageManagerSetup, root: string) {
  const pinned = `${packageManager}@${version ?? 'latest'}`;
  const setup: Record<PackageManager, string | null> = {
    pnpm: `corepack enable && corepack prepare ${pinned} --activate`,
    yarn: `corepack enable && corepack prepare ${pinned} --activate`,
    npm: null,
    bun: `npm install -g ${pinned}`,
  };
  const exec: Record<PackageManager, string> = { pnpm: 'pnpm exec', npm: 'npx', yarn: 'yarn', bun: 'bunx' };
  const install = frozenInstallCommand(packageManager, root);

  return {
    packageManagerSetup: setup[packageManager],
    installCommand: install,
    execCommand: exec[packageManager],
    cacheMount: CACHE_MOUNTS[packageManager] ?? null,
  };
}

/** Node major for the image: .nvmrc / .node-version, else the Node running the generator */
export function resolveNodeVersion(tree: Tree): string {
  for (const file of ['.nvmrc', '.node-version']) {
    const major = tree.read(file, 'utf-8')?.trim().replace(/^v/, '').split('.')[0];
    if (major && /^\d+$/.test(major)) return major;
  }
  return process.versions.node.split('.')[0];
}

/** Adds entries to the workspace .dockerignore, keeping existing ones */
function updateDockerignore(tree: Tree) {
  const existing = tree.read('.dockerignore', 'utf-8') ?? '';
  const lines = new Set(existing.split('\n').map((line) => line.trim()));
  const missing = DOCKERIGNORE_ENTRIES.filter((entry) => !lines.has(entry));
  if (!missing.length) return;
  const header = existing ? '' : '# Build context for the Dockerfiles in this workspace (next-feature:docker)\n';
  const separator = existing && !existing.endsWith('\n') ? '\n' : '';
  tree.write('.dockerignore', `${existing}${separator}${header}${missing.join('\n')}\n`);
}

function serviceBlock(projectName: string, projectRoot: string, port: number, hasAuth: boolean) {
  const authEnv = hasAuth
    ? `
      # Auth.js callbacks must use the URL the browser sees
      NEXTAUTH_URL: http://localhost:${port}
      AUTH_TRUST_HOST: 'true'`
    : '';
  return `  ${projectName}:
    build:
      context: .
      dockerfile: ${projectRoot}/Dockerfile
    ports:
      - '${port}:${CONTAINER_PORT}'
    # The app's own variables. localhost inside the container is the container
    # itself: reach services on the host via host.docker.internal, and other
    # compose services by their service name.
    env_file:
      - path: ${projectRoot}/.env
        required: false
    environment:
      PORT: '${CONTAINER_PORT}'${authEnv}
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    restart: unless-stopped
`;
}

/**
 * Adds the service to the workspace root compose file (created if missing).
 * The block goes right after `services:`, so other top-level sections
 * (volumes, networks) are left alone; an existing service is never touched.
 */
function updateCompose(tree: Tree, projectName: string, projectRoot: string, port: number, hasAuth: boolean) {
  const file = COMPOSE_FILES.find((name) => tree.exists(name)) ?? 'compose.yaml';
  const content = tree.read(file, 'utf-8') ?? '';
  const block = serviceBlock(projectName, projectRoot, port, hasAuth);

  if (new RegExp(`^  ${projectName}:\\s*$`, 'm').test(content)) {
    logger.info(`docker: ${file} already has a "${projectName}" service, leaving it unchanged`);
    return;
  }
  if (/^services:[ \t]*$/m.test(content)) {
    const normalized = content.endsWith('\n') ? content : `${content}\n`;
    tree.write(file, normalized.replace(/^services:[ \t]*\n/m, (line) => `${line}${block}`));
    return;
  }
  const separator = content && !content.endsWith('\n') ? '\n' : '';
  tree.write(file, `${content}${separator}services:\n${block}`);
}

/** app/ directory of a Next.js App Router project (app/ or src/app/) */
function appDir(tree: Tree, projectRoot: string) {
  return ['app', 'src/app'].map((dir) => joinPathFragments(projectRoot, dir)).find((dir) => tree.exists(dir));
}

export async function dockerGenerator(tree: Tree, options: DockerGeneratorSchema) {
  const projectName = options.projectName;
  const port = options.port ?? CONTAINER_PORT;
  const project = readProjectConfiguration(tree, projectName);
  const projectRoot = project.root;

  const nextConfig = NEXT_CONFIG_FILES.map((file) => joinPathFragments(projectRoot, file)).find((file) => tree.exists(file));
  if (!nextConfig) {
    throw new Error(`docker: "${projectName}" isn't a Next.js application (no next.config.* in ${projectRoot})`);
  }

  const standalone =
    enableStandaloneOutput(tree, projectRoot) || (tree.read(nextConfig, 'utf-8') ?? '').includes(STANDALONE_OUTPUT_ENV);
  if (!standalone) {
    logger.warn(
      `docker: couldn't update ${nextConfig}; when ${STANDALONE_OUTPUT_ENV}=standalone, set output: 'standalone' and outputFileTracingRoot to the workspace root`
    );
  }

  // Where @nx/next:build writes .next: its outputPath, or the project itself (inferred targets)
  const outputPath: string = project.targets?.build?.options?.outputPath ?? projectRoot;
  const app = appDir(tree, projectRoot);
  const hasHealthRoute = !!app && tree.exists(joinPathFragments(app, 'api/health/route.ts'));
  const hasAuth = !!app && tree.exists(joinPathFragments(app, 'api/auth/[...nextauth]/route.ts'));

  const packageManager = resolvePackageManager(tree);
  if (!packageManager.version && packageManager.packageManager !== 'npm') {
    logger.warn(`docker: couldn't detect the ${packageManager.packageManager} version; the Dockerfile installs the latest`);
  }

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    tmpl: '',
    projectName,
    projectRoot,
    outputPath,
    nodeVersion: resolveNodeVersion(tree),
    hasPublic: tree.exists(joinPathFragments(projectRoot, 'public')),
    healthPath: hasHealthRoute ? '/api/health' : '/',
    packageManager: packageManager.packageManager,
    ...dockerCommands(packageManager, tree.root),
  });

  updateDockerignore(tree);
  if (options.compose !== false) updateCompose(tree, projectName, projectRoot, port, hasAuth);

  project.targets ??= {};
  project.targets['docker-build'] = {
    executor: 'nx:run-commands',
    options: { command: `docker build -f ${projectRoot}/Dockerfile -t ${projectName} .` },
  };
  project.targets['docker-run'] = {
    executor: 'nx:run-commands',
    options: {
      command:
        options.compose !== false
          ? `docker compose up --build ${projectName}`
          : `docker run --rm -p ${port}:${CONTAINER_PORT} ${projectName}`,
    },
  };
  updateProjectConfiguration(tree, projectName, project);

  if (!options.skipFormat) await formatFiles(tree);
}

export default dockerGenerator;

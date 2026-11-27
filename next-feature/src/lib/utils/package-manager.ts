import {
  detectPackageManager,
  getPackageManagerCommand,
  getPackageManagerVersion,
  type PackageManager,
  readJson,
  Tree,
} from '@nx/devkit';

const LOCKFILES: Record<PackageManager, string[]> = {
  pnpm: ['pnpm-lock.yaml'],
  yarn: ['yarn.lock'],
  npm: ['package-lock.json'],
  bun: ['bun.lock', 'bun.lockb'],
};

export interface PackageManagerSetup {
  packageManager: PackageManager;
  version?: string;
}

/**
 * The workspace's package manager and version: the root package.json
 * `packageManager` field, else the lockfile, else Nx's detection. Deployment
 * generators pin the version, so the platform doesn't install a different
 * major than the one that wrote the lockfile.
 */
export function resolvePackageManager(tree: Tree): PackageManagerSetup {
  const field: string | undefined = tree.exists('package.json')
    ? readJson(tree, 'package.json').packageManager
    : undefined;
  if (field) {
    const [name, version] = field.split('@');
    if (name in LOCKFILES) {
      return { packageManager: name as PackageManager, version: version?.split('+')[0] };
    }
  }

  const packageManager =
    (Object.keys(LOCKFILES) as PackageManager[]).find((pm) => LOCKFILES[pm].some((file) => tree.exists(file))) ??
    detectPackageManager(tree.root);

  let version: string | undefined;
  try {
    version = getPackageManagerVersion(packageManager, tree.root);
  } catch {
    version = undefined;
  }
  return { packageManager, version };
}

/** Frozen-lockfile install: `pnpm install --frozen-lockfile`, `npm ci`, `yarn install --immutable`, ... */
export function frozenInstallCommand(packageManager: PackageManager, root: string): string {
  return packageManager === 'bun'
    ? 'bun install --frozen-lockfile'
    : getPackageManagerCommand(packageManager, root).ciInstall;
}

/** Runs a workspace binary: `pnpm exec nx`, `npx nx`, `yarn nx`, `bunx nx` */
export function execCommand(packageManager: PackageManager): string {
  const exec: Record<PackageManager, string> = { pnpm: 'pnpm exec', npm: 'npx', yarn: 'yarn', bun: 'bunx' };
  return exec[packageManager];
}

/** Node version files, in the order CI and Docker read them */
export const NODE_VERSION_FILES = ['.nvmrc', '.node-version'];

/** Node major for images and CI: .nvmrc / .node-version, else the Node running the generator */
export function resolveNodeVersion(tree: Tree): string {
  for (const file of NODE_VERSION_FILES) {
    const major = tree.read(file, 'utf-8')?.trim().replace(/^v/, '').split('.')[0];
    if (major && /^\d+$/.test(major)) return major;
  }
  return process.versions.node.split('.')[0];
}

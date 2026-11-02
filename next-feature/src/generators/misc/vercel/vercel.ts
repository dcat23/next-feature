import {
  formatFiles,
  joinPathFragments,
  logger,
  offsetFromRoot,
  type PackageManager,
  readJson,
  readProjectConfiguration,
  Tree,
  writeJson,
} from '@nx/devkit';
import { NX_IGNORE_VERSION } from '../../../lib/constants/versions';
import { addToGitignore } from '../../../lib/utils';
import {
  frozenInstallCommand,
  type PackageManagerSetup,
  resolvePackageManager,
} from '../../../lib/utils/package-manager';
import type { VercelGeneratorSchema } from './schema';

const NEXT_CONFIG_FILES = ['next.config.js', 'next.config.mjs', 'next.config.ts'];

/** Auth.js on Vercel: the URL comes from the request and the host is trusted, so these must not be copied from .env */
export const VERCEL_MANAGED_ENV = ['NEXTAUTH_URL', 'AUTH_URL', 'AUTH_TRUST_HOST'];

/** vercel.json keys this generator owns; any other key in an existing file is kept */
export interface VercelConfig {
  $schema: string;
  framework: 'nextjs';
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  ignoreCommand?: string;
}

/**
 * Install at the workspace root with the workspace package manager. pnpm runs
 * through npx at the pinned version: Vercel picks pnpm by lockfile version,
 * which may not be the major that wrote the lockfile (or reads pnpm-workspace.yaml).
 */
export function vercelInstallCommand({ packageManager, version }: PackageManagerSetup, root: string): string {
  const install = frozenInstallCommand(packageManager, root);
  return packageManager === 'pnpm' && version ? `npx -y pnpm@${version} ${install.replace(/^pnpm /, '')}` : install;
}

/**
 * Vercel's Ignored Build Step: exit 0 skips the deployment. Runs before the
 * install, so nx-ignore installs Nx on its own to compute whether the app is
 * affected since the last deployment (VERCEL_GIT_PREVIOUS_SHA). pnpm 11 fails
 * that install on unapproved dependency build scripts unless strictDepBuilds is off.
 */
export function vercelIgnoreCommand(projectName: string, packageManager: PackageManager): string {
  const env = packageManager === 'pnpm' ? 'pnpm_config_strict_dep_builds=false ' : '';
  return `${env}npx -y nx-ignore@${NX_IGNORE_VERSION} ${projectName}`;
}

function envKeys(tree: Tree, file: string): Set<string> {
  const content = tree.read(file, 'utf-8') ?? '';
  return new Set([...content.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map((match) => match[1]));
}

/**
 * Variables to configure in Vercel: required ones are set in the app's .env
 * (gitignored, so never deployed); optional ones only appear in .env.example
 * (overrides whose defaults live in code). Auth.js URL variables are left out.
 */
export function vercelEnvKeys(tree: Tree, projectRoot: string) {
  const required = new Set([
    ...envKeys(tree, joinPathFragments(projectRoot, '.env')),
    ...envKeys(tree, joinPathFragments(projectRoot, '.env.production')),
  ]);
  const optional = [...envKeys(tree, joinPathFragments(projectRoot, '.env.example'))].filter((key) => !required.has(key));
  const keep = (key: string) => !VERCEL_MANAGED_ENV.includes(key);
  return { required: [...required].filter(keep).sort(), optional: optional.filter(keep).sort() };
}

export async function vercelGenerator(tree: Tree, options: VercelGeneratorSchema) {
  const { projectName } = options;
  const project = readProjectConfiguration(tree, projectName);
  const projectRoot = project.root;

  if (!NEXT_CONFIG_FILES.some((file) => tree.exists(joinPathFragments(projectRoot, file)))) {
    throw new Error(`vercel: "${projectName}" isn't a Next.js application (no next.config.* in ${projectRoot})`);
  }

  // Vercel's Root Directory is the app, so commands start at the workspace root
  const toRoot = offsetFromRoot(projectRoot).replace(/\/$/, '');
  // @nx/next:build writes .next to its outputPath (withNx sets distDir); inferred targets build in place
  const outputPath: string | undefined = project.targets?.build?.options?.outputPath;
  const outputDirectory =
    outputPath && outputPath.replace(/\/$/, '') !== projectRoot
      ? joinPathFragments(offsetFromRoot(projectRoot), outputPath, '.next')
      : '.next';

  const packageManager = resolvePackageManager(tree);
  if (!packageManager.version && packageManager.packageManager === 'pnpm') {
    logger.warn(`vercel: couldn't detect the pnpm version; Vercel picks one from the lockfile version`);
  }

  const config: VercelConfig = {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    framework: 'nextjs',
    installCommand: `cd ${toRoot} && ${vercelInstallCommand(packageManager, tree.root)}`,
    buildCommand: `cd ${toRoot} && npx nx build ${projectName}`,
    outputDirectory,
  };
  if (options.ignoreUnaffected !== false) {
    config.ignoreCommand = `cd ${toRoot} && ${vercelIgnoreCommand(projectName, packageManager.packageManager)}`;
  }

  const file = joinPathFragments(projectRoot, 'vercel.json');
  const existing: Record<string, unknown> = tree.exists(file) ? readJson(tree, file) : {};
  if (options.ignoreUnaffected === false) delete existing['ignoreCommand'];
  writeJson(tree, file, { ...existing, ...config });

  // vercel link / vercel build write project settings and build output here
  addToGitignore(tree, '', () => '.vercel');

  const env = vercelEnvKeys(tree, projectRoot);
  logger.info(
    [
      `vercel: in the Vercel project for "${projectName}", set Root Directory to ${projectRoot} (keep "Include files outside the root directory" enabled).`,
      env.required.length ? `Environment variables to add (Production and Preview): ${env.required.join(', ')}.` : '',
      env.optional.length ? `Optional overrides: ${env.optional.join(', ')}.` : '',
      `Don't add ${VERCEL_MANAGED_ENV.join(', ')}: Auth.js takes the URL from the request on Vercel.`,
    ]
      .filter(Boolean)
      .join('\n')
  );

  if (!options.skipFormat) await formatFiles(tree);
}

export default vercelGenerator;

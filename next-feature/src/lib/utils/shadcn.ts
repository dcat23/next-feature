import { detectPackageManager, getPackageManagerCommand, joinPathFragments, logger, Tree, updateJson } from '@nx/devkit';
import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { SHADCN_CLI_VERSION } from '../constants/versions';
import { externalizeDeclaredDependenciesOnDisk } from './vite-config';

/** `npx` package spec for the shadcn CLI */
export const SHADCN_CLI = `shadcn@${SHADCN_CLI_VERSION}`;

/**
 * The style's base registry item (`styles/<style>/index.json`, a
 * `registry:style`): the packages every component of the style imports
 * (e.g. class-variance-authority, cn, radix-ui), the `utils` item (cn() at the
 * `utils` alias) and the style's theme CSS. `shadcn init` installs it too, but
 * init rewrites components.json; `add index` uses the existing one.
 */
export const SHADCN_BASE_ITEM = 'index';

// Registers the `shadcn` target (next-feature:shadcn executor) on a project's
// project.json, so components can be pulled in later via `npx nx run <name>:shadcn`.
export function addShadcnTarget(tree: Tree, projectRoot: string): void {
  const projectJsonPath = joinPathFragments(projectRoot, 'project.json');
  updateJson(tree, projectJsonPath, (json) => {
    json.targets ??= {};
    json.targets.shadcn = {
      executor: 'next-feature:shadcn',
      options: {},
    };
    return json;
  });
}

export type ShadcnAction = 'add' | 'init' | 'apply';

// Top-level shadcn CLI commands. Used to detect `args` that already carry a
// command (the pre-`action` form, e.g. args="add button"), so it isn't
// prefixed with the default action a second time.
const SHADCN_COMMANDS = [
  'init', 'create', 'apply', 'add', 'diff', 'docs', 'view', 'search', 'list',
  'migrate', 'eject', 'info', 'build', 'mcp', 'preset', 'registry', 'help',
];

export interface ShadcnArgsOptions {
  action?: ShadcnAction;
  preset?: string;
  args?: string;
}

// Builds the argument string for `npx shadcn@latest`: `<action> [--preset=<preset>] [args]`.
// `preset` only applies to `init`/`apply`; passing it with `add` throws rather than
// being silently dropped.
export function buildShadcnArgs({ action, preset, args }: ShadcnArgsOptions): string {
  const extra = (args ?? '').trim();
  const [first] = extra.split(' ');

  if (!action && SHADCN_COMMANDS.includes(first)) {
    if (preset) {
      throw new Error('shadcn: use "action" instead of a command in "args" when passing "preset"');
    }
    return extra;
  }

  const command = action ?? 'add';
  if (preset && command === 'add') {
    throw new Error('shadcn: "preset" is only supported with the "init" or "apply" action');
  }

  return [command, preset ? `--preset=${preset}` : '', extra].filter(Boolean).join(' ');
}

export function runShadcnCli(cwd: string, args: string): { success: boolean } {
  const parsedArgs = args.split(' ').filter(Boolean);

  const result = spawnSync('npx', [SHADCN_CLI, ...parsedArgs], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  return { success: result.status === 0 };
}

// Written into components.json's tailwind.css file only by the style base
// (`add index` / `init`), never by component items
const BASE_CSS_MARKERS = ['shadcn/tailwind.css', 'tw-animate-css'];

/** The nearest tsconfig.base.json / tsconfig.json with `paths`, walking up from dir */
function findTsConfigPaths(dir: string): { baseDir: string; paths: Record<string, string[]> } | null {
  let current = path.resolve(dir);
  for (;;) {
    for (const name of ['tsconfig.base.json', 'tsconfig.json']) {
      const file = path.join(current, name);
      if (!existsSync(file)) continue;
      try {
        const { compilerOptions } = JSON.parse(readFileSync(file, 'utf-8'));
        if (compilerOptions?.paths) {
          return { baseDir: path.join(current, compilerOptions.baseUrl ?? '.'), paths: compilerOptions.paths };
        }
      } catch {
        // tsconfig with comments or invalid JSON: keep looking upwards
      }
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/**
 * Resolves an import alias from components.json (e.g. `@app/web/lib/ui/utils`)
 * to its file through the workspace's tsconfig `paths`, or null.
 */
export function resolveAliasFile(projectDir: string, alias: string): string | null {
  const tsconfig = findTsConfigPaths(projectDir);
  if (!tsconfig) return null;

  for (const [key, [target]] of Object.entries(tsconfig.paths)) {
    if (!target) continue;
    let resolved: string | null = null;
    if (key === alias) resolved = target;
    else if (key.endsWith('/*') && alias.startsWith(key.slice(0, -1))) {
      resolved = target.replace('*', alias.slice(key.length - 1));
    }
    if (!resolved) continue;

    const base = path.join(tsconfig.baseDir, resolved);
    const file = ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((ext) => base + ext).find((candidate) => existsSync(candidate));
    if (file) return file;
  }
  return null;
}

/**
 * Whether the project's style base is installed: its Tailwind CSS file (from
 * components.json) has the base's imports, or the cn() helper the base writes
 * exists at the `utils` alias. Either is enough, so a future base whose CSS
 * changes doesn't make every `add` re-run `add index` (which rewrites the
 * theme). A component `add` without the base writes neither. Projects without
 * components.json aren't shadcn projects and count as installed.
 */
export function isShadcnBaseInstalled(projectDir: string): boolean {
  const componentsJsonPath = path.join(projectDir, 'components.json');
  if (!existsSync(componentsJsonPath)) return true;

  const config = JSON.parse(readFileSync(componentsJsonPath, 'utf-8'));
  const cssFile: string | undefined = config?.tailwind?.css;
  if (!cssFile) return true;

  const cssPath = path.join(projectDir, cssFile);
  if (existsSync(cssPath) && BASE_CSS_MARKERS.some((marker) => readFileSync(cssPath, 'utf-8').includes(marker))) {
    return true;
  }

  const utilsAlias: string | undefined = config?.aliases?.utils;
  return !!utilsAlias && resolveAliasFile(projectDir, utilsAlias) !== null;
}

/**
 * Installs the style base with `shadcn add index --yes` unless it already is.
 * Non-interactive and leaves components.json (and its aliases) untouched,
 * unlike `shadcn init`, which prompts to overwrite it and, when forced,
 * derives new aliases from the first tsconfig path (another project in an Nx
 * workspace). Without the base, components import packages nothing installs.
 */
export function ensureShadcnBase(projectDir: string): { success: boolean } {
  if (isShadcnBaseInstalled(projectDir)) return { success: true };
  logger.info(`shadcn: installing the style base (add ${SHADCN_BASE_ITEM}) in ${projectDir}`);
  return runShadcnCli(projectDir, `add ${SHADCN_BASE_ITEM} --yes`);
}

/**
 * Generator task: installs the style base in a newly generated project and
 * mirrors its packages to the workspace root. A failure (e.g. offline) only
 * warns: the executor installs the base before the first `add` anyway.
 */
export function installShadcnBaseTask(workspaceRoot: string, projectRoot: string, projectName: string) {
  return () => {
    const { success } = ensureShadcnBase(path.join(workspaceRoot, projectRoot));
    if (!success) {
      logger.warn(
        `shadcn: couldn't install the style base in ${projectRoot}. ` +
          `Run \`npx nx run ${projectName}:shadcn --action=init\` later.`
      );
      return;
    }
    syncShadcnDependencies(workspaceRoot, projectRoot);
  };
}

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies'] as const;

// shadcn's CLI installs a component's dependencies straight into the target
// project's own package.json/node_modules via `<pm> add`, scoped to that
// project's directory. It has no notion of the workspace root, so those
// dependencies never reach the root package.json or its install. Mirror
// anything new into the root package.json and reinstall there so the rest
// of the workspace can resolve it too.
//
// The project's own vite build externalizes whatever its package.json
// declares, so these dependencies stay out of its dist/. Projects generated
// before that (static `external: [...]` array) are converted here.
export function syncShadcnDependencies(workspaceRoot: string, projectRoot: string): void {
  if (externalizeDeclaredDependenciesOnDisk(workspaceRoot, projectRoot)) {
    logger.info(`shadcn: ${projectRoot}/vite.config.mts now externalizes everything declared in its package.json`);
  }

  const projectPkgJsonPath = path.join(workspaceRoot, projectRoot, 'package.json');
  const rootPkgJsonPath = path.join(workspaceRoot, 'package.json');

  const projectPkgJson = JSON.parse(readFileSync(projectPkgJsonPath, 'utf-8'));
  const rootPkgJson = JSON.parse(readFileSync(rootPkgJsonPath, 'utf-8'));

  let changed = false;
  for (const field of DEPENDENCY_FIELDS) {
    const projectDeps: Record<string, string> = projectPkgJson[field] ?? {};
    const rootDeps: Record<string, string> = rootPkgJson[field] ?? {};

    for (const [name, version] of Object.entries(projectDeps)) {
      if (!rootDeps[name]) {
        rootDeps[name] = version;
        changed = true;
      }
    }

    if (Object.keys(rootDeps).length) rootPkgJson[field] = rootDeps;
  }

  if (!changed) return;

  writeFileSync(rootPkgJsonPath, JSON.stringify(rootPkgJson, null, 2) + '\n');

  const packageManager = detectPackageManager(workspaceRoot);
  execSync(getPackageManagerCommand(packageManager).install, {
    cwd: workspaceRoot,
    stdio: 'inherit',
  });
}

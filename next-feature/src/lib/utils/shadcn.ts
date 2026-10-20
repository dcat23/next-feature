import { detectPackageManager, getPackageManagerCommand, joinPathFragments, Tree, updateJson } from '@nx/devkit';
import { execSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

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

  const result = spawnSync('npx', ['shadcn@latest', ...parsedArgs], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  return { success: result.status === 0 };
}

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies'] as const;

// shadcn's CLI installs a component's dependencies straight into the target
// project's own package.json/node_modules via `<pm> add`, scoped to that
// project's directory. It has no notion of the workspace root, so those
// dependencies never reach the root package.json or its install. Mirror
// anything new into the root package.json and reinstall there so the rest
// of the workspace can resolve it too.
export function syncShadcnDependencies(workspaceRoot: string, projectRoot: string): void {
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

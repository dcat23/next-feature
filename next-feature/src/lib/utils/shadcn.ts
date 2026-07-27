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

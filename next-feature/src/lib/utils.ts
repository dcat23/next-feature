import { addDependenciesToPackageJson } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { Tree } from '@nx/devkit';

export function updateDependencies(
  tree: Tree,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>
): GeneratorCallback {
  const task: GeneratorCallback = addDependenciesToPackageJson(
    tree,
    dependencies,
    devDependencies,
    undefined,
    true
  );

  return task;
}

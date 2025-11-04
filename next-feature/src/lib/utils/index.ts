import { addDependenciesToPackageJson } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import * as path from 'node:path';

export function updateDependencies(
  tree: Tree,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
  projectRoot?: string
): GeneratorCallback {
  const task: GeneratorCallback = addDependenciesToPackageJson(
    tree,
    dependencies,
    devDependencies,
    projectRoot,
    true
  );

  return task;
}

export function asOutputFile(options: {file?: string | boolean, fileName: string}) {
  return (options.file
    ? (typeof options.file === "string" ? options.file : options.fileName)
    : "index").concat(".ts");
}

/**
 * [add-to-gitignore]
 * next-feature@0.0.10
 * September 1st 2025, 6:41:00 pm
 */
export function addToGitignore(tree: Tree, directory: string, content: () => string) {
  const filePath = path.join(directory, '.gitignore');
  let buffer = tree.read(filePath, "utf-8") ?? "";
  buffer += content();
  tree.write(filePath, buffer);
}

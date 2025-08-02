import { writeJson } from '@nx/devkit';
import { readJson } from '@nx/devkit';
import type { Tree } from '@nx/devkit';
import * as path from 'path';

/**
 * next-feature:update-ts-config-includes
 * Sat Jul 26 2025
 */
export function updateTsConfigIncludes(tree: Tree, projectRoot: string) {
  const tsConfigPath = path.join(projectRoot, "tsconfig.json")

  const tsConfig = tree.exists(tsConfigPath)
    ? readJson(tree, tsConfigPath)
    : {}


  tsConfig["include"] ??= [];
  tsConfig["include"].push("src/lib/types/next-auth.d.ts");


  writeJson(tree, tsConfigPath, tsConfig);
}

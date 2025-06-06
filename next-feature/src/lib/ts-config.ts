import { writeJson } from '@nx/devkit';
import { readJson } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import * as path from 'path';


export function updateTsConfig(tree: Tree, importPathName: string, sourceRoot: string) {
  const tsConfigPath = path.join(".", "tsconfig.base.json")

  const tsConfig = tree.exists(tsConfigPath)
    ? readJson(tree, tsConfigPath)
    : {}

  const importPath = path.join(importPathName, '*');

  tsConfig["compilerOptions"] ??= {};
  // tsConfig["compilerOptions"]["baseUrl"] ??= '.';
  tsConfig["compilerOptions"]["paths"] ??= {};
  tsConfig["compilerOptions"]["paths"][importPath] ??= [];

  const srcPath = path.join(sourceRoot ?? 'src', "*");

  const paths = tsConfig["compilerOptions"]["paths"][importPath] as string[]
  if (!paths.includes(srcPath)) {
    paths.push(srcPath);
    tsConfig["compilerOptions"]["paths"][importPath] = paths;
  }

  writeJson(tree, tsConfigPath, tsConfig);
}

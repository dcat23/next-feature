import { writeJson } from '@nx/devkit';
import { readJson } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import * as path from 'path';

interface TsConfigOptions {
  projectRoot: string;
  srcPath: string;
  importPath: string;
}

export function updateTsConfig(tree: Tree, options: TsConfigOptions, fileName = "tsconfig.json") {
  const tsConfigPath = path.join(options.projectRoot, fileName)

  const tsConfig = tree.exists(tsConfigPath)
    ? readJson(tree, tsConfigPath)
    : {}

  const importPath = path.join(options.importPath, '*');

  tsConfig["compilerOptions"] ??= {};
  tsConfig["compilerOptions"]["baseUrl"] ??= '.';
  tsConfig["compilerOptions"]["paths"] ??= {};
  tsConfig["compilerOptions"]["paths"][importPath] ??= [];

  const srcPath = path.join(options.srcPath, "*");

  const paths = tsConfig["compilerOptions"]["paths"]["@/*"] as string[]
  if (!paths.includes(srcPath)) {
    paths.push(srcPath);
    tsConfig["compilerOptions"]["paths"][importPath] = paths;
  }

  writeJson(tree, tsConfigPath, tsConfig);
}

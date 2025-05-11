import { writeJson } from '@nx/devkit';
import { readJson } from '@nx/devkit';
import { runTasksInSerial } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { applicationGenerator } from '@nx/next';
import * as path from 'path';
import { TANSTACK_VERSION } from '../../lib/constants';
import { ZOD_VERSION } from '../../lib/constants';
import { writeToDotenv } from '../../lib/dot-env';
import { updateDependencies } from '../../lib/utils';
import authGenerator from '../auth/auth';
import axiosGenerator from '../axios/axios';
import databaseGenerator from '../database/database';
import type { NormalizedPresetGeneratorSchema } from './schema';
import { PresetGeneratorSchema } from './schema';

function normalize(
  options: PresetGeneratorSchema
): NormalizedPresetGeneratorSchema {
  options.directory ??= options.name;
  options.srcPath ??= 'src';

  const projectRoot = `${options.directory}`;
  const sourceRoot = path.join(projectRoot, options.srcPath);
  return {
    tmpl: '',
    ...options,
    projectRoot,
    sourceRoot,
  };
}

export async function presetGenerator(
  tree: Tree,
  options: PresetGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  tasks.push(
    await applicationGenerator(tree, {
      directory: normalizedOptions.directory,
      name: normalizedOptions.name,
      style: 'tailwind',
      e2eTestRunner: 'none',
      unitTestRunner: 'jest',
      src: true,
      appDir: true,
      linter: Linter.EsLint,
      skipFormat: true,
    })
  );

  updateTsConfig(tree, normalizedOptions);

  const projectRoot = normalizedOptions.projectRoot;

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectRoot,
    normalizedOptions
  );

  const dependencies: Record<string, string> = {
    '@tanstack/react-query': TANSTACK_VERSION,
    zod: ZOD_VERSION,
  };
  const devDependencies: Record<string, string> = {};

  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  writeToDotenv(tree, normalizedOptions, {
    '# PRESET': '',
    BACKEND_API_URL: 'http://localhost:8080',
  });

  tasks.push(
    await axiosGenerator(tree, {
      projectName: normalizedOptions.name,
      directory: normalizedOptions.directory,
      skipFormat: true,
    })
  );

  tasks.push(
    await authGenerator(tree, {
      projectName: normalizedOptions.name,
      directory: normalizedOptions.directory,
      skipFormat: true,
    })
  );

  if (normalizedOptions.useDb || normalizedOptions.useAll) {
    tasks.push(
      await databaseGenerator(tree, {
        projectName: normalizedOptions.name,
        directory: normalizedOptions.directory,
        skipFormat: true,
      })
    );
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}


function updateTsConfig(tree: Tree, options: NormalizedPresetGeneratorSchema) {
  const tsConfigPath = path.join(options.projectRoot, "tsconfig.json")

  const tsConfig = tree.exists(tsConfigPath)
    ? readJson(tree, tsConfigPath)
    : {}

  tsConfig["compilerOptions"] ??= {};
  tsConfig["compilerOptions"]["baseUrl"] ??= '.';
  tsConfig["compilerOptions"]["paths"] ??= {};
  tsConfig["compilerOptions"]["paths"]["@/*"] ??= [];

  const srcPath = path.join(options.srcPath, "*");

  const paths = tsConfig["compilerOptions"]["paths"]["@/*"] as string[]
  if (!paths.includes(srcPath)) {
    paths.push(srcPath);
    tsConfig["compilerOptions"]["paths"]["@/*"] = paths;
  }

  writeJson(tree, tsConfigPath, tsConfig);
}

export default presetGenerator;

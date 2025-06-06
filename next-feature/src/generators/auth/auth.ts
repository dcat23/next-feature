import { joinPathFragments } from '@nx/devkit';
import { generateFiles } from '@nx/devkit';
import {
  addDependenciesToPackageJson,
  formatFiles,
  type GeneratorCallback,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { NEXTAUTH_VERSION } from '../../lib/constants';
import { writeToDotenv } from '../../lib/dot-env';
import { initializeGenerator } from '../../lib/generator-config';
import type {
  AuthGeneratorSchema,
  NormalizedAuthGeneratorSchema,
} from './schema';

function normalize(
  options: AuthGeneratorSchema
): NormalizedAuthGeneratorSchema {
  options.package ??= 'lib';
  return {
    tmpl: '',
    ...options,
  };
}

export async function authGenerator(tree: Tree, options: AuthGeneratorSchema) {
  const normalizedOptions = normalize(options);

  const { projectRoot, sourceRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'auth'
  );

  const depTask = updateDependencies(tree);

  writeToDotenv(tree, { projectRoot }, {
    "# AUTH": "",
    NEXTAUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_ROOT_DOMAIN: "localhost:3000",
    AUTH_SECRET: generateSecret(),
    AUTH_GITHUB_ID: "",
    AUTH_GITHUB_SECRET: "",
  });

  generateFiles(tree, path.join(__dirname, 'files/src'), sourceRoot, normalizedOptions);

  const authRoute = joinPathFragments(sourceRoot, "app/api/auth/[...nextauth]/route.ts")

  if (!tree.exists(authRoute)) {
    generateFiles(tree, path.join(__dirname, 'files/app'), sourceRoot + "/app", normalizedOptions);
  }

  if (!options.skipFormat) await formatFiles(tree);

  return depTask
}


function updateDependencies(tree: Tree) {
  const task: GeneratorCallback = (
    addDependenciesToPackageJson(
      tree,
      {
        'next-auth': NEXTAUTH_VERSION,
      },
      {},
      undefined,
      true
    )
  );

  return task;
}

export default authGenerator;

function generateSecret(): string {
  return require('crypto').randomBytes(32).toString('hex');
}


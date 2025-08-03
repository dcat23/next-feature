import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { NEXTAUTH_VERSION } from '../../lib/constants/versions';
import { writeToDotenv } from '../../lib/dotenv/dot-env';
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

  writeToDotenv(tree, { projectRoot, section: "auth" }, {
    NEXTAUTH_URL: "http://localhost:4200",
    NEXT_PUBLIC_ROOT_DOMAIN: "localhost:4200",
    AUTH_SECRET: generateSecret(),
  });

  // updateTsConfigIncludes(tree, projectRoot);

  generateFiles(tree, path.join(__dirname, 'files/src'), sourceRoot, normalizedOptions);

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



import { joinPathFragments } from '@nx/devkit';
import { OverwriteStrategy } from '@nx/devkit';
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
  return {
    ...options,
  };
}

export async function authGenerator(tree: Tree, options: AuthGeneratorSchema) {
  const normalizedOptions = normalize(options);

  const { sourceRoot, root: projectRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'auth'
  );

  const depTask = updateDependencies(tree);

  const entries: Record<string, string> = {
    "NEXTAUTH_URL": "http://localhost:3000",
    "NEXT_PUBLIC_ROOT_DOMAIN": "localhost:3000",
    "AUTH_SECRET": generateSecret(),
  }

  writeToDotenv(tree, { projectRoot }, entries, 'example');

  generateFiles(tree, path.join(__dirname, 'files/src'), sourceRoot, {
    ...options,
    tmpl: '',
    overwriteStrategy: OverwriteStrategy.KeepExisting,
  });

  const authRoute = joinPathFragments(sourceRoot, "app/api/auth/[...nextauth]/route.ts")

  if (!tree.exists(authRoute)) {
    generateFiles(tree, path.join(__dirname, 'files/app'), sourceRoot + "/app", {
      ...options,
      tmpl: '',
      overwriteStrategy: OverwriteStrategy.KeepExisting,
    });
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


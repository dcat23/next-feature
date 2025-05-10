import { OverwriteStrategy } from '@nx/devkit';
import { addDependenciesToPackageJson } from '@nx/devkit';
import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { PRISMA_VERSION } from '../../lib/constants';
import { PRISMA_AUTH_VERSION } from '../../lib/constants';
import { writeToDotenv } from '../../lib/dot-env';
import { initializeGenerator } from '../../lib/generator-config';
import type { NormalizedDatabaseGeneratorSchema } from './schema';
import { DatabaseGeneratorSchema } from './schema';

function normalize(
  options: DatabaseGeneratorSchema
): NormalizedDatabaseGeneratorSchema {
  options.projectName ??= 'features';
  options.directory ??= 'lib';
  return {
    tmpl: '',
    ...options,
  };
}

export async function databaseGenerator(
  tree: Tree,
  options: DatabaseGeneratorSchema
) {

  const normalizedOptions = normalize(options);

  const { sourceRoot, root: projectRoot, name } = await initializeGenerator(
    tree,
    normalizedOptions,
    'database'
  );

  const depTask = updateDependencies(tree);

  const databaseUrl = (database: 'postgresql' | 'mysql') => {
    return `${database}://$\{DATABASE_USER}:$\{DATABASE_PASSWORD}@$\{DATABASE_HOST}:$\{DATABASE_PORT}/$\{DATABASE_NAME},`
  };
  const dotenvEntries: Record<string, string> = {
    DATABASE_USER: "default",
    DATABASE_HOST: "localhost",
    DATABASE_PASSWORD: "password",
    DATABASE_NAME: name,
    DATABASE_PORT: "5432",
    DATABASE_URL: databaseUrl("postgresql")
};
  writeToDotenv(tree, { projectRoot } , dotenvEntries, "example")

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    ...normalizedOptions,
    tmpl: "",
    overwriteStrategy: OverwriteStrategy.KeepExisting,
  });


  // generateFiles(tree, path.join(__dirname, 'files/src'), sourceRoot, {
  //   ...normalizedOptions,
  //   tmpl: "",
  //   overwriteStrategy: OverwriteStrategy.KeepExisting,
  // });


  if (!options.skipFormat) await formatFiles(tree);

  return depTask;
}

export default databaseGenerator;


function updateDependencies(tree: Tree) {
  const task: GeneratorCallback = (
    addDependenciesToPackageJson(
      tree,
      {
        '@prisma/client': PRISMA_VERSION,
        '@auth/prisma-adapter': PRISMA_AUTH_VERSION,
      },
      {
        "prisma": PRISMA_VERSION
      },
      undefined,
      true
    )
  );

  return task;
}

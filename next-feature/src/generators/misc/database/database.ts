import type { GeneratorCallback } from '@nx/devkit';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  names,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import {
  PRISMA_AUTH_VERSION,
  PRISMA_VERSION,
} from '../../../lib/constants/versions';
import { writeToDotenv } from '../../../lib/dotenv/dot-env';
import type { NormalizedDatabaseGeneratorSchema } from './schema';
import { DatabaseGeneratorSchema } from './schema';
import { initializeCodeGenerator, normalizeCodeGenerator } from '../../../lib/utils/code-generator';

function normalize(
  options: DatabaseGeneratorSchema
): NormalizedDatabaseGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  normalized.driver ??= 'postgresql';
  normalized.projectName ??= normalized.name

  const port = normalized.driver === 'postgresql' ? 5432 : 3306;

  const databaseName = normalized.names.constantName.toLowerCase();
  return {
    ...normalized,
    databaseName,
    port
  };
}

export async function databaseGenerator(
  tree: Tree,
  options: DatabaseGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const { projectRoot, sourceRoot } = await initializeCodeGenerator(
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
    DATABASE_NAME: normalizedOptions.databaseName,
    DATABASE_PORT: String(normalizedOptions.port),
    DATABASE_URL: databaseUrl(normalizedOptions.driver)
  };

  writeToDotenv(tree, { projectRoot, section: "db" } , dotenvEntries)

  generateFiles(tree, path.join(__dirname, 'files/src'), sourceRoot, normalizedOptions);

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

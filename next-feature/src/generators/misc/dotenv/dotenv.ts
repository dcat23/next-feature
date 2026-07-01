import { formatFiles, Tree } from '@nx/devkit';
import { syncDotenv } from '../../../lib/dotenv/dot-env';
import { DEFAULT_ENV_VAR_SCHEMA, updateEnvConfig } from '../../../lib/dotenv/env-config';
import { parseKeyValuePairs, type ResolvedProject, resolveProject, resolveSyncProject } from "./lib/utils";
import type { DotenvGeneratorSchema } from './schema';

export async function dotenvGenerator(
  tree: Tree,
  options: DotenvGeneratorSchema
) {
  const projects = [
    await resolveProject(tree, options.projectName),
    ...(options.projects ?? [])
      .map((projectName) => resolveSyncProject(tree, projectName))
      .filter((project): project is ResolvedProject => Boolean(project)),
  ];

  const set = parseKeyValuePairs(options.set);

  syncDotenv(
    tree,
    projects.map((project) => project.root),
    {
      section: options.section,
      files: options.all ? 'all' : options.files,
    },
    { set, unset: options.unset }
  );

  if (!options.skipEnvConfig) {
    const schemaSet = Object.fromEntries(
      Object.keys(set ?? {}).map((key) => [key, DEFAULT_ENV_VAR_SCHEMA])
    );

    for (const project of projects) {
      updateEnvConfig(tree, project.sourceRoot, { set: schemaSet, unset: options.unset });
    }
  }

  if (!options.skipFormat) await formatFiles(tree);
}

export default dotenvGenerator;

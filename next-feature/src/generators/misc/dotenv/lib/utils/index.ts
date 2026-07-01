import { logger, readProjectConfiguration, Tree } from "@nx/devkit";
import featureGenerator from "../../../../project/feature/feature";


export function parseKeyValuePairs(entries: string[] = []): Record<string, string> | undefined {
  if (entries.length === 0) return undefined;

  return Object.fromEntries(
    entries.map((entry) => {
      const [key, ...rest] = entry.split('=');
      return [key, rest.join('=')];
    })
  );
}

export interface ResolvedProject {
  root: string;
  sourceRoot: string;
}

/** The primary project is auto-created if missing, matching every other generator's `projectName` handling. */
export async function resolveProject(tree: Tree, projectName: string): Promise<ResolvedProject> {
  try {
    const { root, sourceRoot } = readProjectConfiguration(tree, projectName);
    return { root, sourceRoot: sourceRoot ?? root };
  } catch {
    await featureGenerator(tree, { name: projectName, skipFormat: true });
    const { root, sourceRoot } = readProjectConfiguration(tree, projectName);
    return { root, sourceRoot: sourceRoot ?? root };
  }
}

/** Sync targets are best-effort: an unknown project name is skipped rather than auto-created. */
export function resolveSyncProject(tree: Tree, projectName: string): ResolvedProject | undefined {
  try {
    const { root, sourceRoot } = readProjectConfiguration(tree, projectName);
    return { root, sourceRoot: sourceRoot ?? root };
  } catch {
    logger.warn(`dotenv: project "${projectName}" not found, skipping`);
    return undefined;
  }
}

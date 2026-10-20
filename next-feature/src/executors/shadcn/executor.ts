import { logger, type ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import { buildShadcnArgs, runShadcnCli, syncShadcnDependencies } from '../../lib/utils/shadcn';
import type { ShadcnExecutorSchema } from './schema';

export default async function runExecutor(
  options: ShadcnExecutorSchema,
  context: ExecutorContext
) {
  const projectName = context.projectName;
  const projectRoot = context.projectsConfigurations.projects[projectName].root;
  const cwd = path.join(context.root, projectRoot);

  let args: string;
  try {
    args = buildShadcnArgs(options);
  } catch (error) {
    logger.error((error as Error).message);
    return { success: false };
  }

  const result = runShadcnCli(cwd, args);
  if (result.success) {
    syncShadcnDependencies(context.root, projectRoot);
  }

  return result;
}

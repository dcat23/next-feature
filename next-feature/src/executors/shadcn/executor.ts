import type { ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import { runShadcnCli } from '../../lib/utils/shadcn';
import type { ShadcnExecutorSchema } from './schema';

export default async function runExecutor(
  options: ShadcnExecutorSchema,
  context: ExecutorContext
) {
  const projectName = context.projectName;
  const projectRoot = context.projectsConfigurations.projects[projectName].root;
  const cwd = path.join(context.root, projectRoot);

  return runShadcnCli(cwd, options.args ?? 'add');
}

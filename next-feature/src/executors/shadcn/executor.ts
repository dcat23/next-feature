import type { ExecutorContext } from '@nx/devkit';
import { spawnSync } from 'child_process';
import * as path from 'path';
import type { ShadcnExecutorSchema } from './schema';

export default async function runExecutor(
  options: ShadcnExecutorSchema,
  context: ExecutorContext
) {
  const projectName = context.projectName;
  const projectRoot = context.projectsConfigurations.projects[projectName].root;
  const cwd = path.join(context.root, projectRoot);

  const args = (options.args ?? 'add').split(' ').filter(Boolean);

  const result = spawnSync('npx', ['shadcn@latest', ...args], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  return { success: result.status === 0 };
}

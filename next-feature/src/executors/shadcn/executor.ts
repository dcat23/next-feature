import { logger, type ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import {
  buildShadcnArgs,
  ensureShadcnBase,
  runShadcnCli,
  SHADCN_BASE_ITEM,
  syncShadcnDependencies,
} from '../../lib/utils/shadcn';
import type { ShadcnExecutorSchema } from './schema';

export default async function runExecutor(
  options: ShadcnExecutorSchema,
  context: ExecutorContext
) {
  const projectName = context.projectName;
  const projectRoot = context.projectsConfigurations.projects[projectName].root;
  const cwd = path.join(context.root, projectRoot);

  // `init` would prompt to overwrite the generated components.json (and,
  // forced, replace its aliases with another project's), so the init action
  // installs the style base into the existing config instead. A real init
  // stays available as args="init --force".
  if (options.action === 'init') {
    if (options.preset) {
      logger.error('shadcn: to change the style of an existing project, use --action=apply --preset=<preset>');
      return { success: false };
    }
    const extra = (options.args ?? '').trim();
    const result = runShadcnCli(cwd, ['add', SHADCN_BASE_ITEM, '--yes', extra].filter(Boolean).join(' '));
    if (result.success) syncShadcnDependencies(context.root, projectRoot);
    return result;
  }

  let args: string;
  try {
    args = buildShadcnArgs(options);
  } catch (error) {
    logger.error((error as Error).message);
    return { success: false };
  }

  // Components import their style's base packages without declaring them
  const [command, ...rest] = args.split(' ').filter(Boolean);
  if (command === 'add' && !rest.includes(SHADCN_BASE_ITEM)) {
    const base = ensureShadcnBase(cwd);
    if (!base.success) return base;
  }

  const result = runShadcnCli(cwd, args);

  if (result.success) {
    syncShadcnDependencies(context.root, projectRoot);
  }

  return result;
}

import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  joinPathFragments,
  logger,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import type { ClientConfigGeneratorSchema } from './schema';
import { asClientEnvVar, DEFAULT_CLIENT_PACKAGE, normalize } from './lib/utils';
import { asCaretRange, updatePackageJsonDependencies } from '../../project/feature/utils';
import { clientContent, defaultExportContent } from './lib/utils/content';
import { PLUGIN_VERSION, SERVER_ONLY_VERSION } from '../../../lib/constants/versions';
import { updateEnvConfig } from '../../../lib/dotenv/env-config';
import { updateDotenv } from '../../../lib/dotenv/dot-env';
import { exportFile } from '../../../lib/export-file';
import { updateDependencies } from '../../../lib/utils';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { addNamedImports } from '../../../lib/utils/imports';
import { writeCodeFile } from '../../../lib/write-file';

const DEFAULT_BASE_URL = 'http://localhost:8080';

/** Whether any of the project's dotenv files already defines `key`, in any section. */
function isDotenvKeyDefined(tree: Tree, projectRoot: string, key: string) {
  const pattern = new RegExp(`^${key}=`, 'm');
  return ['.env', '.env.example'].some((file) =>
    pattern.test(tree.read(joinPathFragments(projectRoot, file), 'utf-8') ?? '')
  );
}

/**
 * A feature library's vite build only externalizes what its own package.json
 * declares, so an undeclared client package would be bundled into dist/.
 * Custom client packages (clientPackage) are left for the project to declare:
 * their version isn't known here.
 */
function declareClientDependency(tree: Tree, projectRoot: string, clientImportPath: string) {
  if (clientImportPath !== DEFAULT_CLIENT_PACKAGE) {
    logger.warn(
      `client-config: declare ${clientImportPath} in ${joinPathFragments(projectRoot, 'package.json')} ` +
      'so the library build keeps it external.'
    );
    return;
  }
  updatePackageJsonDependencies(tree, projectRoot, {
    [DEFAULT_CLIENT_PACKAGE]: asCaretRange(PLUGIN_VERSION),
    'server-only': SERVER_ONLY_VERSION,
  }, {});
}

/** Whether lib/config/client.ts already declares this client. */
function hasClient(buffer: string, clientName: string, isDefault: boolean) {
  if (new RegExp(`^export const ${clientName}\\b`, 'm').test(buffer)) return true;
  // Files from earlier versions hold a single default client with no named
  // export: treat it as `api` rather than adding a second one
  const isLegacy =
    /^export default /m.test(buffer) && !/^export const \w+ = new ApiClient\b/m.test(buffer);
  return isDefault && isLegacy;
}

/**
 * [client-config-generator]
 * Adds a named, configured ApiClient to lib/config/client.ts, creating the
 * file (and a missing project) on first use. The first client is also the
 * file's default export, which the action generator imports. Each client
 * reads its base URL from its own env var.
 */
export async function clientConfigGenerator(
  tree: Tree,
  options: ClientConfigGeneratorSchema
): Promise<GeneratorCallback> {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  const { projectRoot, sourceRoot, projectName, projectType } =
    await initializeCodeGenerator(tree, normalizedOptions, 'client-config');

  const { clientName, isDefault, outputFileName } = normalizedOptions;
  const configDirectory = path.join(sourceRoot, normalizedOptions.package);
  const configPath = path.join(configDirectory, outputFileName);
  const isNewFile = !tree.exists(configPath);

  // Before the early return, so re-running fixes libraries created before
  // the dependency was declared
  tasks.push(
    updateDependencies(tree, {
      '@next-feature/client': PLUGIN_VERSION,
      'server-only': SERVER_ONLY_VERSION,
    }, {})
  );
  if (projectType === 'library') {
    declareClientDependency(tree, projectRoot, normalizedOptions.clientImportPath);
  }

  if (!isNewFile && hasClient(tree.read(configPath, 'utf-8'), clientName, isDefault)) {
    return runTasksInSerial(...tasks);
  }

  const envVar = asClientEnvVar(projectName, clientName, options.envVar);
  if (!isDotenvKeyDefined(tree, projectRoot, envVar)) {
    updateDotenv(tree, { projectRoot, section: 'client' }, {
      set: { [envVar]: DEFAULT_BASE_URL },
      skipExisting: true,
    });
  }
  updateEnvConfig(tree, sourceRoot, { set: [envVar] });

  if (isNewFile) {
    generateFiles(
      tree,
      path.join(__dirname, 'files', 'src'),
      sourceRoot,
      { ...normalizedOptions, projectName }
    );
  }
  addNamedImports(tree, configPath, './env', [envVar]);
  await writeCodeFile(tree, configPath, { ...normalizedOptions, envVar, userAgent: projectName }, clientContent);
  if (isNewFile) {
    tree.write(configPath, tree.read(configPath, 'utf-8') + defaultExportContent(clientName));
  }

  if (normalizedOptions.export && projectType === 'library') {
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath, 'server');
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default clientConfigGenerator;

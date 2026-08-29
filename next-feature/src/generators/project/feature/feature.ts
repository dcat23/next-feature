import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, runTasksInSerial, Tree } from '@nx/devkit';
import { libraryGenerator } from '@nx/next';
import * as path from 'path';
import { AXIOS_VERSION, CLSX_VERSION, CVA_VERSION, LUCIDE_VERSION, NEXTAUTH_VERSION, PINO_HTTP_VERSION, PINO_PRETTY_VERSION, PINO_VERSION, SONNER_VERSION, TAILWIND_MERGE_VERSION, ZOD_VERSION } from '../../../lib/constants/versions';
import { updateDotenv } from '../../../lib/dotenv/dot-env';
import { updateEnvConfig } from '../../../lib/dotenv/env-config';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';
import { initializeProjectGenerator, updateDependencies } from '../../../lib/utils';
import { addRollupExternalPackages } from '../../../lib/utils/vite-config';
import { FeatureGeneratorSchema } from './schema';
import { includeSourceInReleaseManifests, updatePackageJsonExports } from './utils';
import { addShadcnTarget } from '../../../lib/utils/shadcn';
import { normalizeFeatureGenerator } from './utils/normalize';
import { LOGGING } from 'next-feature/src/lib/dotenv/constants/defaults';

export async function featureGenerator(
  tree: Tree,
  options: FeatureGeneratorSchema
) {
  const normalizedOptions = normalizeFeatureGenerator(options);
  const tasks: GeneratorCallback[] = [];

  tasks.push(await libraryGenerator(tree, {
    directory: normalizedOptions.directory,
    name: normalizedOptions.name,
    importPath: normalizedOptions.importPath,
    bundler: 'vite',
    publishable: true,
    style: 'tailwind',
    unitTestRunner: 'jest',
    linter: "eslint",
    component: false,
    skipFormat: true,
    useProjectJson: true,
  }))

  updatePackageJsonExports(tree, normalizedOptions.projectRoot);
  includeSourceInReleaseManifests(tree, normalizedOptions.projectRoot);

  tasks.push(await initializeProjectGenerator(tree, normalizedOptions, "feature"))

  const { sourceRoot, importPath, type, projectRoot, apiKeyName } = normalizedOptions;

  writeWildCardPathToTsConfig(tree, importPath, sourceRoot);

  /* Update dependencies */
  const dependencies: Record<string, string> = {
    sonner: SONNER_VERSION,
    zod: ZOD_VERSION
  };

  const devDependencies: Record<string, string> = {};

  const setDotenv: Record<string, string> = {};

  switch (type) {
    case 'logging':
      // Handle logging-specific logic
      dependencies['pino'] = PINO_VERSION;
      dependencies['pino-http'] = PINO_HTTP_VERSION;
      dependencies['pino-pretty'] = PINO_PRETTY_VERSION;
      // pino ships dual browser/node builds; Vite's default (browser-favoring)
      // resolve conditions bundle the wrong one in unless excluded entirely.
      // thread-stream must be external too: pino-pretty's transport spawns it
      // as a worker thread, which needs the real on-disk worker.js rather than
      // a bundled copy.
      addRollupExternalPackages(tree, projectRoot, ['pino', 'pino-http', 'pino-pretty', 'thread-stream']);
      
      setDotenv[LOGGING.beaconPathKey] = LOGGING.beaconPathValue;
      setDotenv[LOGGING.serviceNameKey] = normalizedOptions.name;

      break;
    case 'client':
        // Handle client-specific logic
        dependencies['axios'] = AXIOS_VERSION;

        setDotenv[apiKeyName] = 'http://localhost:8080';
      break;
    case 'auth':
      // Handle auth-specific logic
      dependencies['next-auth'] = NEXTAUTH_VERSION;
      break;
    case 'ui':
      // Handle ui-specific logic
      dependencies['clsx'] = CLSX_VERSION;
      dependencies['tailwind-merge'] = TAILWIND_MERGE_VERSION;
      dependencies['class-variance-authority'] = CVA_VERSION;
      dependencies['lucide-react'] = LUCIDE_VERSION;

      addShadcnTarget(tree, projectRoot);
      break;
  }


  tasks.push(updateDependencies(tree, dependencies, devDependencies))

  /* Generate files */
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'src'),
    sourceRoot,
    normalizedOptions
  );

  if (type !== 'generic') {
    generateFiles(
      tree,
      path.join(__dirname, 'files', type),
      projectRoot,
      normalizedOptions
    );
  }

  updateDotenv(tree, { projectRoot, section: type }, {
    set: setDotenv,
    skipExisting: true
  }); 

  updateEnvConfig(tree, sourceRoot, { 
    set: Object.keys(setDotenv) 
  });

  /* Clean up */
  tree.delete(path.join(sourceRoot, "lib", "hello-server.tsx"));

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}


export default featureGenerator;

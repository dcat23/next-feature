import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, runTasksInSerial, Tree } from '@nx/devkit';
import { libraryGenerator } from '@nx/next';
import * as path from 'path';
import { AXIOS_VERSION, NEXTAUTH_VERSION, PINO_HTTP_VERSION, PINO_PRETTY_VERSION, PINO_VERSION, REACT_PEER_VERSION, SERVER_ONLY_VERSION, SONNER_VERSION, ZOD_VERSION } from '../../../lib/constants/versions';
import { updateDotenv } from '../../../lib/dotenv/dot-env';
import { updateEnvConfig } from '../../../lib/dotenv/env-config';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';
import { initializeProjectGenerator, updateDependencies } from '../../../lib/utils';
import { addRollupExternalPackages } from '../../../lib/utils/vite-config';
import { FeatureGeneratorSchema } from './schema';
import { asCaretRange, includeSourceInReleaseManifests, updatePackageJsonDependencies, updatePackageJsonExports } from './utils';
import { addShadcnTarget } from '../../../lib/utils/shadcn';
import { normalizeFeatureGenerator } from './utils/normalize';
import { LOGGING } from '../../../lib/dotenv/constants/defaults';

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
    zod: ZOD_VERSION,
    'server-only': SERVER_ONLY_VERSION
  };

  const devDependencies: Record<string, string> = {};

  // Packages the library's vite build leaves external, declared in the
  // feature's own package.json (published) rather than inlined into dist/.
  // server-only: bundling it would bake in its throwing (non react-server)
  // build, so leave it for Next.js to resolve. zod: lib/config/env.ts.
  const libraryDependencies: Record<string, string> = {
    'server-only': SERVER_ONLY_VERSION,
    zod: asCaretRange(ZOD_VERSION),
  };
  const libraryPeerDependencies: Record<string, string> = {
    react: REACT_PEER_VERSION,
    'react-dom': REACT_PEER_VERSION,
  };
  addRollupExternalPackages(tree, projectRoot, ['server-only', 'zod']);

  const setDotenv: Record<string, string> = {};

  switch (type) {
    case 'base':
      // peer: toast() only reaches the app's <Toaster /> if both use the
      // same copy of sonner (each copy has its own toast store)
      libraryPeerDependencies['sonner'] = asCaretRange(SONNER_VERSION);
      addRollupExternalPackages(tree, projectRoot, ['sonner']);
      break;
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
      libraryDependencies['pino'] = PINO_VERSION;
      libraryDependencies['pino-http'] = PINO_HTTP_VERSION;
      libraryDependencies['pino-pretty'] = PINO_PRETTY_VERSION;
      
      setDotenv[LOGGING.beaconPathKey] = LOGGING.beaconPathValue;
      setDotenv[LOGGING.serviceNameKey] = normalizedOptions.name;

      break;
    case 'client':
        // Handle client-specific logic
        dependencies['axios'] = AXIOS_VERSION;
        libraryDependencies['axios'] = asCaretRange(AXIOS_VERSION);
        // shared with the app's code: ApiError checks axios/zod errors by
        // shape, so an app on another version doesn't need the same copy
        addRollupExternalPackages(tree, projectRoot, ['axios']);

        setDotenv[apiKeyName] = 'http://localhost:8080';
      break;
    case 'auth':
      // Handle auth-specific logic
      dependencies['next-auth'] = NEXTAUTH_VERSION;
      // peer: the app's SessionProvider (next-auth/react) must match the
      // version this library's handlers/session code runs. The regex covers
      // subpath imports (next-auth/jwt, next-auth/providers/*).
      libraryPeerDependencies['next-auth'] = asCaretRange(NEXTAUTH_VERSION);
      addRollupExternalPackages(tree, projectRoot, ['next-auth', /^next-auth\//]);
      break;
    case 'ui':
      // shadcn init/add installs the packages its components need
      addShadcnTarget(tree, projectRoot);
      break;
  }


  tasks.push(updateDependencies(tree, dependencies, devDependencies))
  updatePackageJsonDependencies(tree, projectRoot, libraryDependencies, libraryPeerDependencies);

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

import type { GeneratorCallback } from '@nx/devkit';
import { formatFiles, generateFiles, runTasksInSerial, Tree } from '@nx/devkit';
import { libraryGenerator } from '@nx/next';
import { existsSync } from 'fs';
import * as path from 'path';
import { AXIOS_VERSION, NEXTAUTH_VERSION, PINO_HTTP_VERSION, PINO_PRETTY_VERSION, PINO_VERSION, REACT_PEER_VERSION, SERVER_ONLY_VERSION, SONNER_VERSION, ZOD_VERSION } from '../../../lib/constants/versions';
import { updateDotenv } from '../../../lib/dotenv/dot-env';
import { updateEnvConfig } from '../../../lib/dotenv/env-config';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';
import { initializeProjectGenerator, updateDependencies } from '../../../lib/utils';
import { externalizeDeclaredDependencies, preserveUseClientBoundaries } from '../../../lib/utils/vite-config';
import { FeatureGeneratorSchema } from './schema';
import { asApiKeyName, asCaretRange, includeSourceInReleaseManifests, updatePackageJsonDependencies, updatePackageJsonExports } from './utils';
import { addShadcnTarget, installShadcnBaseTask } from '../../../lib/utils/shadcn';
import { normalizeFeatureGenerator } from './utils/normalize';
import { LOGGING, OPTIONAL_ENV_SCHEMA } from '../../../lib/dotenv/constants/defaults';

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

  const { sourceRoot, importPath, type, projectRoot } = normalizedOptions;

  writeWildCardPathToTsConfig(tree, importPath, sourceRoot);

  /* Update dependencies */
  const dependencies: Record<string, string> = {
    sonner: SONNER_VERSION,
    zod: ZOD_VERSION,
    'server-only': SERVER_ONLY_VERSION
  };

  const devDependencies: Record<string, string> = {};

  // Declared in the feature's own package.json (published), which also makes
  // the vite build keep them external (externalizeDeclaredDependencies).
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
  // External without being declared
  const extraExternals: string[] = [];

  const setDotenv: Record<string, string> = {};
  // Optional overrides with defaults in code: documented in .env.example and
  // typed as optional in lib/config/env.ts, never required in .env
  const optionalDotenv: Record<string, string> = {};
  // client type: env var ApiClient falls back to when no baseURL is passed
  const clientApiKeyName = asApiKeyName(normalizedOptions.name);

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
      extraExternals.push('thread-stream');
      libraryDependencies['pino'] = PINO_VERSION;
      libraryDependencies['pino-http'] = PINO_HTTP_VERSION;
      libraryDependencies['pino-pretty'] = PINO_PRETTY_VERSION;
      
      optionalDotenv[LOGGING.beaconPathKey] = LOGGING.beaconPathValue;
      optionalDotenv[LOGGING.serviceNameKey] = normalizedOptions.name;

      break;
    case 'client':
        // Handle client-specific logic
        dependencies['axios'] = AXIOS_VERSION;
        libraryDependencies['axios'] = asCaretRange(AXIOS_VERSION);
        // ApiError checks axios/zod errors by shape, so an app on another
        // version doesn't need the same copy

        // ApiClient's fallback baseURL only: projects pass their own
        // <NAME>_API_URL from lib/config/client.ts (client-config generator)
        optionalDotenv[clientApiKeyName] = 'http://localhost:8080';
      break;
    case 'auth':
      // Handle auth-specific logic
      dependencies['next-auth'] = NEXTAUTH_VERSION;
      // peer: the app's SessionProvider (next-auth/react) must match the
      // version this library's handlers/session code runs. Subpath imports
      // (next-auth/jwt, next-auth/providers/*) stay external with it.
      libraryPeerDependencies['next-auth'] = asCaretRange(NEXTAUTH_VERSION);
      // getAccessToken() reads next/headers from the app's Next.js, and the
      // token refresh guard uses AsyncLocalStorage: neither may be bundled
      // (Vite would replace the Node builtin with an empty browser shim)
      extraExternals.push('next', 'node:async_hooks');
      break;
    case 'ui':
      // shadcn add installs the packages its components need into this
      // project's package.json, which keeps them external automatically.
      // The style base is installed after the install task (below).
      addShadcnTarget(tree, projectRoot);
      break;
  }


  tasks.push(updateDependencies(tree, dependencies, devDependencies))
  updatePackageJsonDependencies(tree, projectRoot, libraryDependencies, libraryPeerDependencies);
  externalizeDeclaredDependencies(tree, projectRoot, extraExternals);
  preserveUseClientBoundaries(tree, projectRoot);

  /* Generate files */
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'src'),
    sourceRoot,
    normalizedOptions
  );

  // Types without extra scaffolding (generic) have no template folder
  const typeFiles = path.join(__dirname, 'files', type);
  if (existsSync(typeFiles)) {
    generateFiles(tree, typeFiles, projectRoot, { ...normalizedOptions, apiKeyName: clientApiKeyName });
  }

  updateDotenv(tree, { projectRoot, section: type }, {
    set: setDotenv,
    skipExisting: true
  }); 

  updateEnvConfig(tree, sourceRoot, { 
    set: Object.keys(setDotenv) 
  });

  if (Object.keys(optionalDotenv).length) {
    updateDotenv(tree, { projectRoot, section: type, exampleOnly: true }, {
      set: optionalDotenv,
      skipExisting: true,
    });
    updateEnvConfig(tree, sourceRoot, {
      set: Object.fromEntries(Object.keys(optionalDotenv).map((key) => [key, OPTIONAL_ENV_SCHEMA])),
    });
  }

  /* Clean up */
  tree.delete(path.join(sourceRoot, "lib", "hello-server.tsx"));

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  // After the install: shadcn add index installs the style base (packages,
  // cn() at the utils alias, theme CSS) using the generated components.json
  if (type === 'ui' && !normalizedOptions.skipShadcn) {
    tasks.push(installShadcnBaseTask(tree.root, projectRoot, normalizedOptions.name));
  }

  return runTasksInSerial(...tasks);
}


export default featureGenerator;

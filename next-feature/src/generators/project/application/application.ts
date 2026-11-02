import {
  generateFiles,
  type GeneratorCallback,
  joinPathFragments,
  offsetFromRoot,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import * as path from 'path';
import {
  NEXTAUTH_VERSION,
  NEXT_THEMES_VERSION,
  PINO_VERSION,
  PINO_HTTP_VERSION,
  PINO_PRETTY_VERSION,
  PLUGIN_VERSION,
  SONNER_VERSION,
  TAILWIND_VERSION,
  TANSTACK_VERSION,
  ZOD_VERSION
} from '../../../lib/constants/versions';
import { updateDotenv } from '../../../lib/dotenv/dot-env';
import { updateEnvConfig } from '../../../lib/dotenv/env-config';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';
import { updateDependencies } from '../../../lib/utils';
import { addServerExternalPackages } from '../../../lib/utils/next-config';
import { addShadcnTarget, installShadcnBaseTask } from '../../../lib/utils/shadcn';
import featureGenerator from '../feature/feature';
import { ApplicationGeneratorSchema } from './schema';
import { generateSecret } from './utils';
import { normalizeApplicationGeneratorSchema } from './utils/normalize';
import { LOGGING } from '../../../lib/dotenv/constants/defaults';


export async function applicationGenerator(
  tree: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalizeApplicationGeneratorSchema(options);
  const tasks: GeneratorCallback[] = [];

  tasks.push(
    await nextApplicationGenerator(tree, {
      directory: normalizedOptions.directory,
      name: normalizedOptions.name,
      style: 'none',
      e2eTestRunner: 'none',
      unitTestRunner: 'jest',
      src: normalizedOptions.useSrc,
      appDir: true,
      linter: "eslint",
      skipFormat: true,
      useProjectJson: true,
    })
  );

  const { sourceRoot, projectRoot, importPath } = normalizedOptions;

  generateFiles(
    tree,
    path.join(__dirname, 'files/src'),
    sourceRoot,
    {
      ...normalizedOptions,
      // app/global.css -> workspace root, for its @source of the feature libraries
      workspaceOffset: offsetFromRoot(joinPathFragments(sourceRoot, 'app')),
    }
  );

  generateFiles(
    tree,
    path.join(__dirname, 'files/common'),
    projectRoot,
    normalizedOptions
  );

  addShadcnTarget(tree, projectRoot);

  const dependencies: Record<string, string> = {
    '@tanstack/react-query': TANSTACK_VERSION,
    sonner: SONNER_VERSION,
    zod: ZOD_VERSION,

  };
  const devDependencies: Record<string, string> = {
    '@tailwindcss/postcss': TAILWIND_VERSION,
    'tailwindcss': TAILWIND_VERSION,
    'next-themes': NEXT_THEMES_VERSION
  };

  writeWildCardPathToTsConfig(tree, importPath, sourceRoot);

  const setDotenv: Record<string, string> = {
  };



  if (normalizedOptions.useAuth) {
    // Route handler + SessionProvider wiring that expects a sibling `@feature/auth` library.
    generateFiles(
      tree,
      path.join(__dirname, 'files/auth'),
      sourceRoot,
      normalizedOptions
    );

    dependencies['next-auth'] = NEXTAUTH_VERSION;

    updateDotenv(tree, { projectRoot, section: 'auth' }, {
      set: {
        NEXTAUTH_URL: 'http://localhost:4200',
        AUTH_SECRET: generateSecret(),
      },
    });

    // Credentials for the auth feature's zero-config OAuth providers (only
    // needed for the providers kept in lib/auth/index.ts)
    updateDotenv(tree, { projectRoot, section: 'auth', exampleOnly: true }, {
      set: {
        AUTH_GITHUB_ID: '',
        AUTH_GITHUB_SECRET: '',
        AUTH_GOOGLE_ID: '',
        AUTH_GOOGLE_SECRET: '',
      },
      skipExisting: true,
    });

    try {
      readProjectConfiguration(tree, 'auth');
    } catch {
      tasks.push(
        await featureGenerator(tree, {
          name: 'auth',
          type: 'auth',
          skipFormat: true,
        })
      );
    }
  }

  if (!normalizedOptions.skipLogging) {
    // instrumentation.ts calls the published package's registerPino with
    // this app's lib/config/logging.ts options.
    // lib/config/logging.ts uses this release's createPinoOptions, so raise
    // an older @next-feature/logging
    tasks.push(
      updateDependencies(tree, { '@next-feature/logging': PLUGIN_VERSION }, {}, { updateExistingVersions: true })
    );
    dependencies['pino'] = PINO_VERSION;
    dependencies['pino-http'] = PINO_HTTP_VERSION;
    devDependencies['pino-pretty'] = PINO_PRETTY_VERSION;

    addServerExternalPackages(tree, projectRoot, ['pino', 'pino-http', 'pino-pretty', 'thread-stream']);

    generateFiles(
      tree,
      path.join(__dirname, 'files/logging'),
      sourceRoot,
      normalizedOptions
    );

    // Optional overrides: the library defaults the beacon path to the route
    // generated above and lib/config/logging.ts passes this app's name as the
    // service, so neither is set in .env, only documented in .env.example.
    updateDotenv(tree, { projectRoot, section: 'logging', exampleOnly: true }, {
      set: {
        [LOGGING.beaconPathKey]: LOGGING.beaconPathValue,
        [LOGGING.serviceNameKey]: normalizedOptions.name,
      },
      skipExisting: true,
    });
  }

  updateDotenv(tree,
    { projectRoot, section: 'app' },
    { set: setDotenv }
  );
  updateEnvConfig(tree, sourceRoot, { set: Object.keys(setDotenv) });

  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  // After the install: shadcn add index installs the style base into this
  // app's package.json and app/global.css, using the generated components.json
  if (!normalizedOptions.skipShadcn) {
    tasks.push(installShadcnBaseTask(tree.root, projectRoot, normalizedOptions.name));
  }

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;

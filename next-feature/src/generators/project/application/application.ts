import {
  generateFiles,
  type GeneratorCallback,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import * as path from 'path';
import {
  NEXTAUTH_VERSION,
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
import { addShadcnTarget } from '../../../lib/utils/shadcn';
import featureGenerator from '../feature/feature';
import { ApplicationGeneratorSchema } from './schema';
import { generateSecret } from './utils';
import { normalizeApplicationGeneratorSchema } from './utils/normalize';
import { LOGGING } from 'next-feature/src/lib/dotenv/constants/defaults';


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
      style: 'tailwind',
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
    normalizedOptions
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
    'tailwindcss': TAILWIND_VERSION
  };

  writeWildCardPathToTsConfig(tree, importPath, sourceRoot);

  const setDotenv: Record<string, string> = {
    /* layout.tsx always reads NEXT_PUBLIC_ROOT_DOMAIN; keep env.ts in sync regardless of useAuth. */
    NEXT_PUBLIC_ROOT_DOMAIN: 'http://localhost:4200',
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
    // instrumentation.ts (generated above) imports registerPino from the
    // published @next-feature/logging package unconditionally.
    dependencies['@next-feature/logging'] = PLUGIN_VERSION;
    dependencies['pino'] = PINO_VERSION;
    dependencies['pino-http'] = PINO_HTTP_VERSION;
    devDependencies['pino-pretty'] = PINO_PRETTY_VERSION;

    addServerExternalPackages(tree, projectRoot, ['pino', 'pino-pretty', 'thread-stream']);

    updateDotenv(tree, { projectRoot, section: 'logging' }, {
      set: {
        [LOGGING.beaconPathKey]: LOGGING.beaconPathValue,
        [LOGGING.serviceNameKey]: normalizedOptions.name,
      },
    });
    updateEnvConfig(tree, sourceRoot, {
      set: [LOGGING.beaconPathKey, LOGGING.serviceNameKey], 
    });

  }

  updateDotenv(tree,
    { projectRoot, section: 'app' },
    { set: setDotenv }
  );
  updateEnvConfig(tree, sourceRoot, { set: Object.keys(setDotenv) });

  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;

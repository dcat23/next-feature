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
  AXIOS_VERSION,
  NEXTAUTH_VERSION,
  SONNER_VERSION,
  TAILWIND_VERSION,
  TANSTACK_VERSION,
  ZOD_VERSION
} from '../../../lib/constants/versions';
import { updateDotenv } from '../../../lib/dotenv/dot-env';
import { updateEnvConfig } from '../../../lib/dotenv/env-config';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';
import { updateDependencies } from '../../../lib/utils';
import { asApiKeyName } from '../feature/utils';
import featureGenerator from '../feature/feature';
import { ApplicationGeneratorSchema } from './schema';
import { generateSecret } from './utils';
import { normalizeApplicationGeneratorSchema } from './utils/normalize';
import { dotenvGenerator } from '../../misc/dotenv/dotenv';


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

  /* layout.tsx always reads NEXT_PUBLIC_ROOT_DOMAIN; keep env.ts in sync regardless of useAuth/env. */
  await dotenvGenerator(tree, {
    projectName: normalizedOptions.name,
    set: [`NEXT_PUBLIC_ROOT_DOMAIN=localhost:4200`],
    section: 'root',
    skipFormat: true,
  })

  if (normalizedOptions.useAuth) {
    // Route handler + SessionProvider wiring that expects a sibling `@feature/auth` library.
    generateFiles(
      tree,
      path.join(__dirname, 'files/auth'),
      sourceRoot,
      normalizedOptions
    );

    dependencies['next-auth'] = NEXTAUTH_VERSION;

    await dotenvGenerator(tree, {
      projectName: normalizedOptions.name,
      set: [
        `NEXTAUTH_URL=http://localhost:4200`,
        `AUTH_SECRET: ${generateSecret()}`
      ],
      section: 'auth',
      skipEnvConfig: true,
      skipFormat: true,
    })

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

  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;

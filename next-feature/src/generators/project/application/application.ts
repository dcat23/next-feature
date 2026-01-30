import {
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import * as path from 'path';
import { ApplicationGeneratorSchema } from './schema';
import {
  SONNER_VERSION,
  TANSTACK_VERSION,
  TAILWIND_VERSION,
  ZOD_VERSION,
} from '../../../lib/constants/versions';
import { updateDependencies } from '../../../lib/utils';
import axiosGenerator from '../../misc/axios/axios';
import authGenerator from '../../misc/auth/auth';
import { writeToDotenv } from '../../../lib/dotenv/dot-env';
import { generateSecret } from './utils';
import { normalizeApplicationGeneratorSchema } from './utils/normalize';
import { writeWildCardPathToTsConfig } from '../../../lib/ts-config';


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

  writeToDotenv(tree, { projectRoot, section: "auth" }, {
    NEXTAUTH_URL: "http://localhost:4200",
    NEXT_PUBLIC_ROOT_DOMAIN: "localhost:4200",
    AUTH_SECRET: generateSecret(),
  });

  writeWildCardPathToTsConfig(tree, importPath, sourceRoot);
  
  if (normalizedOptions.useAxios) {
    tasks.push(await axiosGenerator(tree, {
      name: normalizedOptions.name,
      projectName: normalizedOptions.name,
      directory: normalizedOptions.directory,
      skipFormat: true
    }))
  }

  if (normalizedOptions.useAuth) {
    tasks.push(
      await authGenerator(tree, {
        name: normalizedOptions.name,
        projectName: normalizedOptions.name,
        directory: normalizedOptions.directory,
        skipFormat: true,
      })
    );
  }

  tasks.push(updateDependencies(tree, dependencies, devDependencies));

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;

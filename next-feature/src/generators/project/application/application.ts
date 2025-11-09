import {
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import * as path from 'path';
import {
  ApplicationGeneratorSchema,
  NormalizedApplicationGeneratorSchema,
} from './schema';
import { Linter } from '@nx/eslint';
import {
  SONNER_VERSION,
  TANSTACK_VERSION,
  ZOD_VERSION,
} from '../../../lib/constants/versions';
import { updateDependencies } from '../../../lib/utils';
import axiosGenerator from '../../misc/axios/axios';
import authGenerator from '../../misc/auth/auth';
import { writeToDotenv } from '../../../lib/dotenv/dot-env';
import { generateSecret } from './utils';

function normalize(
  options: ApplicationGeneratorSchema
): NormalizedApplicationGeneratorSchema {
  const directory = path.join(options.directory ?? 'apps', options.name);

  const projectRoot = directory;
  const sourceRoot = path.join(projectRoot, 'src');
  const importPath = `@app/${options.name}`;

  return {
    tmpl: '',
    ...options,
    directory,
    projectRoot,
    sourceRoot,
    importPath,
  };
}

export async function applicationGenerator(
  tree: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  tasks.push(
    await nextApplicationGenerator(tree, {
      directory: normalizedOptions.directory,
      name: normalizedOptions.name,
      style: 'tailwind',
      e2eTestRunner: 'none',
      unitTestRunner: 'jest',
      src: true,
      appDir: true,
      linter: Linter.EsLint,
      skipFormat: true,
      useProjectJson: true
    })
  );

  const { projectRoot } = normalizedOptions;

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectRoot,
    normalizedOptions
  );

  const dependencies: Record<string, string> = {
    '@tanstack/react-query': TANSTACK_VERSION,
    sonner: SONNER_VERSION,
    zod: ZOD_VERSION,
  };
  const devDependencies: Record<string, string> = {};

  writeToDotenv(tree, { projectRoot, section: "auth" }, {
    NEXTAUTH_URL: "http://localhost:4200",
    NEXT_PUBLIC_ROOT_DOMAIN: "localhost:4200",
    AUTH_SECRET: generateSecret(),
  });

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

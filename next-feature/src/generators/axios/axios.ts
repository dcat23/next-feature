import { formatFiles, generateFiles, logger, readProjectConfiguration, Tree } from '@nx/devkit';
import * as path from 'path';
import { AXIOS_VERSION } from '../../lib/constants/versions';
import { writeToDotenv } from '../../lib/dotenv/dot-env';
import { initializeGenerator } from '../../lib/generator-config';
import { updateDependencies } from '../../lib/utils';
import type {
  AxiosGeneratorSchema,
  NormalizedAxiosGeneratorSchema,
} from './schema';
import { asApiKeyName } from './utils';

function normalize(
  options: AxiosGeneratorSchema
): NormalizedAxiosGeneratorSchema {
  const keyName = asApiKeyName(options.name);
  options.projectName ??= options.name;
  options.package ??= "lib"

  return {
    tmpl: '',
    ...options,
    keyName,
  };
}

export async function axiosGenerator(
  tree: Tree,
  options: AxiosGeneratorSchema
) {

  const normalizedOptions = normalize(options);

  const { projectRoot, sourceRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'axios'
  );

  const { keyName, appProjectName } = normalizedOptions;

  const depTask = updateDependencies(tree, { axios: AXIOS_VERSION }, {});

  const properties = {
    [keyName]: 'http://localhost:8080',
  }

  writeToDotenv(tree, { projectRoot, section: "axios" }, properties);

  if (appProjectName) {
    try {
      const { root: appProjectRoot } = readProjectConfiguration(tree, appProjectName)
      writeToDotenv(tree, { projectRoot: appProjectRoot, section: "axios" }, properties);
    } catch {
      logger.info("error reading app project");
    }
  }

  if (!normalizedOptions.skipFiles) {
    generateFiles(tree, path.join(__dirname, 'files'), sourceRoot, normalizedOptions);
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return depTask;
}

export default axiosGenerator;

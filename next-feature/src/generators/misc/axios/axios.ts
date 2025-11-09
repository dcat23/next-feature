import { formatFiles, generateFiles, logger, readProjectConfiguration, Tree } from '@nx/devkit';
import * as path from 'path';
import { AXIOS_VERSION } from '../../../lib/constants/versions';
import { writeToDotenv } from '../../../lib/dotenv/dot-env';
import { updateDependencies } from '../../../lib/utils';
import type {
  AxiosGeneratorSchema,
  NormalizedAxiosGeneratorSchema,
} from './schema';
import { asApiKeyName, asApiName } from './utils';
import {
  initializeCodeGenerator,
  normalizeCodeGenerator,
} from '../../../lib/utils/code-generator';

function normalize(
  options: AxiosGeneratorSchema
): NormalizedAxiosGeneratorSchema {
  const normalized = normalizeCodeGenerator(options);
  const keyName = asApiKeyName(normalized.name);
  const apiName = asApiName(normalized.name);
  normalized.projectName ??= normalized.name;
  normalized.useInterceptor = Boolean(normalized.useInterceptor);

  return {
    ...normalized,
    keyName,
    apiName
  };
}

export async function axiosGenerator(
  tree: Tree,
  options: AxiosGeneratorSchema
) {

  const normalizedOptions = normalize(options);

  const { projectRoot, directory } = await initializeCodeGenerator(
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
    generateFiles(tree, path.join(__dirname, 'files', 'src'), directory, normalizedOptions);
    if (normalizedOptions.useInterceptor) {
      generateFiles(tree, path.join(__dirname, 'files', 'interceptor'), directory, normalizedOptions);
    }
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return depTask;
}

export default axiosGenerator;

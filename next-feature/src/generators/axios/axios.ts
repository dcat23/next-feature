import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { AXIOS_VERSION } from '../../lib/constants';
import { writeToDotenv } from '../../lib/dot-env';
import { initializeGenerator } from '../../lib/generator-config';
import { updateDependencies } from '../../lib/utils';
import type {
  AxiosGeneratorSchema,
  NormalizedAxiosGeneratorSchema,
} from './schema';

function normalize(
  options: AxiosGeneratorSchema
): NormalizedAxiosGeneratorSchema {
  return {
    tmpl: '',
    ...options,
  };
}

export async function axiosGenerator(
  tree: Tree,
  options: AxiosGeneratorSchema
) {
  const normalizedOptions = normalize(options);

  const { root: projectRoot, sourceRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'axios'
  );

  const depTask = updateDependencies(tree, { axios: AXIOS_VERSION }, {});

  writeToDotenv(tree, { projectRoot }, {
      '# AXIOS': '',
      BACKEND_API_URL: 'http://localhost:8080',
  });


  generateFiles(tree, path.join(__dirname, 'files'), sourceRoot, normalizedOptions);

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return depTask;
}

export default axiosGenerator;

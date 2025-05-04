import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { AXIOS_VERSION } from '../../lib/constants';
import * as path from 'path';
import type { AxiosGeneratorSchema } from './schema';

export async function axiosGenerator(
  tree: Tree,
  options: AxiosGeneratorSchema
) {
  const projectConfiguration = readProjectConfiguration(tree, 'features');
  const { sourceRoot, root: projectRoot } = projectConfiguration;

  generateFiles(tree, path.join(__dirname, 'files'), sourceRoot, options);
  await formatFiles(tree);
}

function updateDependencies(tree: Tree) {
  const task: GeneratorCallback = (
    addDependenciesToPackageJson(
      tree,
      {
        axios: AXIOS_VERSION,
      },
      {},
      undefined,
      true
    )
  );

  return task;
}


export default axiosGenerator;

import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  OverwriteStrategy,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { AXIOS_VERSION } from '../../lib/constants';
import { initializeGenerator } from '../../lib/generator-config';
import type { AxiosGeneratorSchema, NormalizedAxiosGeneratorSchema } from './schema';


function normalize(options: AxiosGeneratorSchema): NormalizedAxiosGeneratorSchema {

  return {
    ...options,
  }
}

export async function axiosGenerator(
  tree: Tree,
  options: AxiosGeneratorSchema
) {
  const normalizedOptions = normalize(options);

  const { sourceRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'axios'
  );

  updateDependencies(tree);

  generateFiles(tree, path.join(__dirname, 'files/src'), sourceRoot, {
    ...options,
    tmpl: '',
    overwriteStrategy: OverwriteStrategy.KeepExisting,
  });

  if (!options.skipFormat) await formatFiles(tree);
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

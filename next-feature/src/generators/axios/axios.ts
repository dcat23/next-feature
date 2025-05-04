import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  OverwriteStrategy,
  Tree,
} from '@nx/devkit';
import { writeToDotenv } from 'next-feature/src/lib/dot-env';
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

  const { sourceRoot, root: projectRoot } = await initializeGenerator(
    tree,
    normalizedOptions,
    'axios'
  );


  const depTask = updateDependencies(tree);

  generateFiles(tree, path.join(__dirname, 'files'), sourceRoot, {
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

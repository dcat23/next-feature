import {
  formatFiles,
  logger,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { AXIOS_VERSION } from '../../../lib/constants/versions';
import { writeToDotenv } from '../../../lib/dotenv/dot-env';
import { updateDependencies } from '../../../lib/utils';
import type { AxiosGeneratorSchema } from './schema';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { normalize } from './utils';

export async function axiosGenerator(
  tree: Tree,
  options: AxiosGeneratorSchema
) {
  const normalizedOptions = normalize(options);

  const { projectRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'axios'
  );

  const { keyName, appProjectName } = normalizedOptions;

  const depTask = updateDependencies(tree, { axios: AXIOS_VERSION }, {});

  const properties = {
    [keyName]: 'http://localhost:8080',
  };

  writeToDotenv(tree, { projectRoot, section: 'axios' }, properties);

  if (appProjectName) {
    try {
      const { root: appProjectRoot } = readProjectConfiguration(
        tree,
        appProjectName
      );
      writeToDotenv(
        tree,
        { projectRoot: appProjectRoot, section: 'axios' },
        properties
      );
    } catch {
      logger.info('error reading app project');
    }
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return depTask;
}

export default axiosGenerator;

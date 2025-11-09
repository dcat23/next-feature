import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import type { ActionGeneratorSchema } from './schema';
import { getActionTemplatePath, normalize } from './lib/utils';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import constantGenerator from '../constant/constant';
import utilsGenerator from '../utility/utility';

export async function actionGenerator(
  tree: Tree,
  options: ActionGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  const { directory } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    normalizedOptions.actionType
  );

  // Generate main action file based on type
  const templatePath = getActionTemplatePath(normalizedOptions.actionType);
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'src', templatePath),
    directory,
    normalizedOptions
  );

  // Chain dependent generators for API actions
  if (normalizedOptions.actionType === 'api') {
    if (normalizedOptions.useConstant) {
      tasks.push(
        await constantGenerator(tree, {
          ...normalizedOptions,
          name: normalizedOptions.name,
          file: normalizedOptions.domain.fileName,
          skipFormat: true,
        })
      );
    }

    if (normalizedOptions.useMapper) {
      tasks.push(
        await utilsGenerator(tree, {
          ...normalizedOptions,
          name: normalizedOptions.mapperName,
          file: normalizedOptions.domain.fileName,
          skipFormat: true,
        })
      );
    }
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default actionGenerator;

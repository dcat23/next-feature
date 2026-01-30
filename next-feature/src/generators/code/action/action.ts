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
import { exportFile } from '../../../lib/export-file';
import constantGenerator from '../constant/constant';
import utilsGenerator from '../utility/utility';
import dataTypeGenerator from '../data-type/data-type';
import clientConfigGenerator from '../../misc/client-config/client-config';

export async function actionGenerator(
  tree: Tree,
  options: ActionGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  const { directory, projectName, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    "action"
  );

  // Auto-generate client config if it doesn't exist
  const configPath = path.join(directory, 'lib/client/config.ts');
  if (!tree.exists(configPath)) {
    tasks.push(
      await clientConfigGenerator(tree, {
        projectName,
        clientPackage: options.clientPackage,
        skipFormat: true,
      })
    );
  }

  // Generate main action file based on type
  const templatePath = getActionTemplatePath(normalizedOptions.actionType);
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'src', templatePath),
    directory,
    normalizedOptions
  );

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

  if (normalizedOptions.useTypes) {
    tasks.push(
      await dataTypeGenerator(tree, {
        ...normalizedOptions,
        name: normalizedOptions.domain.className,
        file: normalizedOptions.domain.fileName,
        skipFormat: true,
      })
    );
  }

  if (normalizedOptions.export) {
    await exportFile(tree,
      sourceRoot,
      normalizedOptions.exportPath,
      "server"
    )
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default actionGenerator;

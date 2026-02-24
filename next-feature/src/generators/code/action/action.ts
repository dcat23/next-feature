import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  logger,
  runTasksInSerial,
  Tree
} from '@nx/devkit';
import { Names, NormalizedCodeGeneratorSchema, ProjectGeneratorSchema } from 'next-feature/src/lib/types';
import { writeCodeFile } from 'next-feature/src/lib/write-file';
import * as path from 'path';
import { exportFile } from '../../../lib/export-file';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import clientConfigGenerator from '../../misc/client-config/client-config';
import { HttpMethod } from './lib/constants';
import { ActionType } from './lib/types';
import { normalize } from './lib/utils';
import type { ActionGeneratorSchema } from './schema';

export async function actionGenerator(
  tree: Tree,
  options: ActionGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  logger.info(normalizedOptions);
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
  const outputFile = path.join(directory, normalizedOptions.outputFileName);
  if (!tree.exists(outputFile)) {
    generateFiles(
      tree,
      path.join(__dirname, 'files/src', normalizedOptions.actionType),
      directory,
      normalizedOptions
    );
  }

  await writeCodeFile(
      tree,
      outputFile,
      normalizedOptions,
      normalizedOptions.content,
    )

  // if (normalizedOptions.useConstant) {
  //   tasks.push(
  //     await constantGenerator(tree, {
  //       ...normalizedOptions,
  //       name: normalizedOptions.name,
  //       file: normalizedOptions.outputFileName,
  //       skipFormat: true,
  //     })
  //   );
  // }

  // if (normalizedOptions.useMapper) {
  //   tasks.push(
  //     await utilsGenerator(tree, {
  //       ...normalizedOptions,
  //       name: normalizedOptions.mapperName,
  //       file: normalizedOptions.outputFileName,
  //       skipFormat: true,
  //     })
  //   );
  // }

  // if (normalizedOptions.useTypes) {
  //   tasks.push(
  //     await dataTypeGenerator(tree, {
  //       ...normalizedOptions,
  //       name: normalizedOptions.domain.className,
  //       file: normalizedOptions.outputFileName,
  //       skipFormat: true,
  //     })
  //   );
  // }

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
function utilsGenerator(tree: Tree, arg1: { name: string; file: string; skipFormat: boolean; domain: Names; httpMethod: HttpMethod; endpoint: string; methodName: string; hasRequestBody: boolean; mapperName?: string; configImportPath: string; content: (options: NormalizedCodeGeneratorSchema) => string; actionType: ActionType; useTypes?: boolean; useConstant?: boolean; useMapper?: boolean; clientPackage?: string; projectName: ProjectGeneratorSchema["name"]; export?: boolean; directory?: string; package?: string; tmpl: ""; names: Names; outputFileName: Names["fileName"]; exportPath: string; }): GeneratorCallback | PromiseLike<GeneratorCallback> {
  throw new Error('Function not implemented.');
}


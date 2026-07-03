import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree
} from '@nx/devkit';
import { writeCodeFile } from 'next-feature/src/lib/write-file';
import * as path from 'path';
import { exportFile } from '../../../lib/export-file';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import declarationGenerator from '../declaration/declaration';
import hookGenerator from '../hook/hook';
import clientConfigGenerator from '../../misc/client-config/client-config';
import { normalize } from './lib/utils';
import type { ActionGeneratorSchema } from './schema';

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

  if (normalizedOptions.useConstant) {
    tasks.push(
      await declarationGenerator(tree, {
        ...normalizedOptions,
        kind: 'constant',
        name: normalizedOptions.name,
        file: normalizedOptions.outputFileName,
        skipFormat: true,
      })
    );
  }

  if (normalizedOptions.useMapper) {
    tasks.push(
      await declarationGenerator(tree, {
        ...normalizedOptions,
        kind: 'utility',
        name: normalizedOptions.mapperName,
        file: normalizedOptions.outputFileName,
        skipFormat: true,
      })
    );
  }

  if (normalizedOptions.useTypes) {
    tasks.push(
      await declarationGenerator(tree, {
        ...normalizedOptions,
        kind: 'data-type',
        name: normalizedOptions.domain.className,
        file: normalizedOptions.outputFileName,
        skipFormat: true,
      })
    );
  }

  if (normalizedOptions.useHook && normalizedOptions.actionType !== 'form') {
    tasks.push(
      await hookGenerator(tree, {
        name: normalizedOptions.name,
        projectName,
        actionPackage: normalizedOptions.package,
        actionFile: path.parse(normalizedOptions.outputFileName).name,
        clientPackage: normalizedOptions.clientPackage,
        export: normalizedOptions.export,
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


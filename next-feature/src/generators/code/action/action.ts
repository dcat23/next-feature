import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  runTasksInSerial,
  Tree
} from '@nx/devkit';
import { writeCodeFile } from '../../../lib/write-file';
import * as path from 'path';
import { exportFile } from '../../../lib/export-file';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { addNamedImports } from '../../../lib/utils/imports';
import declarationGenerator from '../declaration/declaration';
import hookGenerator from '../hook/hook';
import clientConfigGenerator from '../../misc/client-config/client-config';
import { normalize } from './lib/utils';
import {
  actionContent,
  apiContent,
  contractContent,
  formContent,
} from './lib/utils/content';
import type { ActionGeneratorSchema } from './schema';
import type { NormalizedActionGeneratorSchema } from './lib/types';

/**
 * Generates the file's directive/import header from a template if it doesn't exist yet
 */
function ensureFile(
  tree: Tree,
  template: 'server' | 'action' | 'form',
  directory: string,
  filePath: string,
  options: NormalizedActionGeneratorSchema
) {
  if (tree.exists(filePath)) return;
  generateFiles(tree, path.join(__dirname, 'files', template), directory, options);
}

export async function actionGenerator(
  tree: Tree,
  options: ActionGeneratorSchema
) {
  const normalizedOptions = normalize(options);
  const tasks: GeneratorCallback[] = [];

  const { directory, projectName, sourceRoot, projectType } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    "action"
  );

  // Auto-generate client config if it doesn't exist
  const configPath = path.join(sourceRoot, 'lib/config/client.ts');
  if (!tree.exists(configPath)) {
    tasks.push(
      await clientConfigGenerator(tree, {
        projectName,
        clientPackage: options.clientPackage,
        skipFormat: true,
      })
    );
  }

  const {
    hasRequestBody,
    schemaName,
    requestType,
    responseType,
    methodName,
    typesImportPath,
    serverImportPath,
  } = normalizedOptions;

  // Request schema + Request/Response types, importable from client components
  const typesFile = path.join(sourceRoot, normalizedOptions.typesOutputFile);
  if (hasRequestBody) addNamedImports(tree, typesFile, 'zod', ['z']);
  await writeCodeFile(tree, typesFile, normalizedOptions, contractContent);

  // Server-only action
  const outputFile = path.join(directory, normalizedOptions.outputFileName);
  ensureFile(tree, 'server', directory, outputFile, normalizedOptions);
  addNamedImports(tree, outputFile, typesImportPath, [
    ...(hasRequestBody ? [schemaName] : []),
    `type ${requestType}`,
    `type ${responseType}`,
  ]);
  if (normalizedOptions.useMapper) {
    addNamedImports(tree, outputFile, normalizedOptions.mapperImportPath, [
      normalizedOptions.mapperName,
    ]);
  }
  await writeCodeFile(tree, outputFile, normalizedOptions, apiContent);

  // declarations append their own extension
  const baseFileName = path.parse(normalizedOptions.outputFileName).name;
  const isForm = normalizedOptions.actionType === 'form';
  const useHook = normalizedOptions.useHook && !isForm;

  // 'use server' wrappers, only for calls originating in client components
  if (useHook) {
    const actionFile = path.join(directory, normalizedOptions.actionOutputFileName);
    ensureFile(tree, 'action', directory, actionFile, normalizedOptions);
    addNamedImports(tree, actionFile, serverImportPath, [methodName]);
    addNamedImports(tree, actionFile, typesImportPath, [`type ${requestType}`]);
    await writeCodeFile(tree, actionFile, normalizedOptions, actionContent);
  }

  if (isForm) {
    const formFile = path.join(directory, normalizedOptions.formOutputFileName);
    ensureFile(tree, 'form', directory, formFile, normalizedOptions);
    addNamedImports(tree, formFile, serverImportPath, [methodName]);
    addNamedImports(tree, formFile, typesImportPath, [`type ${requestType}`]);
    await writeCodeFile(tree, formFile, normalizedOptions, formContent);
  }

  if (normalizedOptions.useConstant) {
    tasks.push(
      await declarationGenerator(tree, {
        ...normalizedOptions,
        kind: 'constant',
        name: normalizedOptions.name,
        file: baseFileName,
        skipFormat: true,
      })
    );
  }

  if (normalizedOptions.useMapper) {
    tasks.push(
      await declarationGenerator(tree, {
        ...normalizedOptions,
        kind: 'utility',
        // lib/utils/<file>.ts, imported by the action
        package: 'lib',
        name: normalizedOptions.mapperName,
        file: baseFileName,
        skipFormat: true,
      })
    );
  }

  if (normalizedOptions.useTypes) {
    tasks.push(
      await declarationGenerator(tree, {
        ...normalizedOptions,
        kind: 'data-type',
        // same lib/types/<file>.ts as the request/response contract
        package: 'lib',
        name: normalizedOptions.domain.className,
        file: baseFileName,
        skipFormat: true,
      })
    );
  }

  if (useHook) {
    tasks.push(
      await hookGenerator(tree, {
        name: normalizedOptions.name,
        projectName,
        actionPackage: normalizedOptions.package,
        actionFile: baseFileName,
        clientPackage: normalizedOptions.clientPackage,
        export: normalizedOptions.export,
        skipFormat: true,
      })
    );
  }

  // Applications have no index/server entrypoints to export from
  if (normalizedOptions.export && projectType === 'library') {
    await exportFile(tree, sourceRoot, normalizedOptions.typesExportPath);
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath, 'server');
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default actionGenerator;


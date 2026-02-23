import { CodeGeneratorSchema, NormalizedCodeGeneratorSchema } from '../types';
import {
  names,
  type ProjectConfiguration,
  readNxJson,
  readProjectConfiguration,
  Tree,
  updateNxJson,
} from '@nx/devkit';
import featureGenerator from '../../generators/project/feature/feature';
import * as path from 'path';
import { PLUGIN_NAME } from '../constants/versions';
import { asOutputFile } from './files';

export async function initializeCodeGenerator(
  tree: Tree,
  options: CodeGeneratorSchema,
  generatorName: string
) {
  const projectName = options.projectName ?? 'base';
  let projectConfiguration: ProjectConfiguration;
  try {
    projectConfiguration = readProjectConfiguration(tree, projectName);
  } catch {
    await featureGenerator(tree, {
      name: projectName,
      directory: options.directory,
    });

    projectConfiguration = readProjectConfiguration(tree, projectName);
  }

  const nxJson = readNxJson(tree);

  nxJson.generators ??= {};
  nxJson.generators[PLUGIN_NAME] ??= {};
  nxJson.generators[PLUGIN_NAME][generatorName] ??= {};

  updateNxJson(tree, nxJson);

  const projectRoot = projectConfiguration.root;
  const sourceRoot = projectConfiguration.sourceRoot;
  const directory = path.join(sourceRoot, options.package ?? '');

  return {
    projectRoot,
    sourceRoot,
    directory,
    projectName,
  };
}

export function handleExportPath(
  options: { package?: string, outputFileName?: string },
  subDirectory = ''
) {
  const outputFileName = path.parse(options.outputFileName).name
  return path
    .join(options.package, subDirectory, outputFileName)
    .split(path.sep)
    .join('/');
}

export function normalizeCodeGenerator<T extends CodeGeneratorSchema = CodeGeneratorSchema>(options: T): NormalizedCodeGeneratorSchema<T> {
  options.package ??= 'lib';
  options.export = Boolean(options.export);

  const mutatedNames = names(options.name);

  const outputFileName = asOutputFile({ file: options.file, fileName: mutatedNames.fileName });

  const exportPath = handleExportPath({ package: options.package, outputFileName });

  return {
    tmpl: '',
    ...options,
    name: mutatedNames.name,
    names: mutatedNames,
    outputFileName,
    exportPath
  };
}


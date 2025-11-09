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
  const projectName = options.projectName ?? "base";
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
  const sourceRoot = path.join(projectRoot, 'src');
  const directory = path.join(sourceRoot, options.package ?? '');

  return {
    projectRoot,
    sourceRoot,
    directory,
    projectName
  };
}

export function normalizeCodeGenerator<T extends CodeGeneratorSchema>(options: T): NormalizedCodeGeneratorSchema<T> {
  options.package ??= 'lib';

  const mutatedNames = names(options.name);

  const outputFileName = asOutputFile({ file: options.file, fileName: mutatedNames.fileName });

  return {
    tmpl: '',
    ...options,
    name: mutatedNames.name,
    names: mutatedNames,
    outputFileName,
  };
}

export function getOutputFileName(options: CodeGeneratorSchema) {
  return options.file
    ? typeof options.file === 'string'
      ? options.file
      : names(options.name).fileName
    : 'index'
}

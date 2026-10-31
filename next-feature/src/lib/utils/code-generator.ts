import { CodeGeneratorSchema, NormalizedCodeGeneratorSchema } from '../types';
import {
  names,
  type ProjectConfiguration,
  type ProjectType,
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
  // Schemas require projectName (CLI flag, prompt or nx.json generator
  // default); this guards programmatic callers. No implicit fallback project.
  const projectName = options.projectName;
  if (!projectName) {
    throw new Error(
      `${generatorName}: projectName is required. Pass --projectName (-p) or set ` +
      `generators["${PLUGIN_NAME}"]["${generatorName}"].projectName in nx.json.`
    );
  }
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

  const nxJson = readNxJson(tree) || {};

  nxJson.generators ??= {};
  nxJson.generators[PLUGIN_NAME] ??= {};
  nxJson.generators[PLUGIN_NAME][generatorName] ??= {};
  nxJson.generators[PLUGIN_NAME][generatorName]["projectName"] ??= projectName;

  updateNxJson(tree, nxJson);

  const projectRoot = projectConfiguration.root;
  const sourceRoot = projectConfiguration.sourceRoot || projectRoot;
  const directory = path.join(sourceRoot, options.package ?? '');
  const projectType = resolveProjectType(tree, projectConfiguration);

  return {
    projectRoot,
    sourceRoot,
    directory,
    projectName,
    projectType,
  };
}

const NEXT_CONFIG_FILES = ['next.config.js', 'next.config.mjs', 'next.config.ts'];

/**
 * Resolves whether the target project is an application or library.
 * Falls back to detecting a next.config file when `projectType` isn't set
 * (e.g. package.json-only projects).
 */
export function resolveProjectType(
  tree: Tree,
  projectConfiguration: ProjectConfiguration
): ProjectType {
  if (projectConfiguration.projectType) return projectConfiguration.projectType;

  return NEXT_CONFIG_FILES.some((file) =>
    tree.exists(path.join(projectConfiguration.root, file))
  )
    ? 'application'
    : 'library';
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


import {
  addProjectConfiguration,
  formatFiles,
  generateFiles, readJson,
  Tree, writeJson
} from '@nx/devkit';
import * as path from 'path';
import { FeatureGeneratorSchema, type NormalizedFeatureGeneratorSchema } from './schema';

export async function featureGenerator(tree: Tree, options: FeatureGeneratorSchema) {
  options.name ??= 'features';
  options.directory ??= "."
  options.srcPath ??= "src"
  return featureGeneratorInternal(tree, {
    ...options,
  })
}

function normalize(options: FeatureGeneratorSchema): NormalizedFeatureGeneratorSchema {
  const projectRoot = `${options.directory}`;
  const sourceRoot = path.join(projectRoot, options.srcPath);

  return {
    ...options,
    projectRoot,
    sourceRoot,
  }
}

export async function featureGeneratorInternal(
  tree: Tree,
  options: FeatureGeneratorSchema
) {
  const normalizedOptions = normalize(options);

  addProjectConfiguration(tree, options.name, {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
    sourceRoot: normalizedOptions.sourceRoot,
    targets: {},
  });

  updateTsConfig(tree, normalizedOptions);




  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    normalizedOptions.projectRoot,
    {
      ...options,
      tmpl: ""
    }
  );
  await formatFiles(tree);
}

function updateTsConfig(tree: Tree, options: NormalizedFeatureGeneratorSchema) {
  const tsConfigPath = path.join(options.projectRoot, "tsconfig.json")

  const tsConfig = tree.exists(tsConfigPath)
    ? readJson(tree, tsConfigPath)
    : {}

  tsConfig["compilerOptions"] ??= {};
  tsConfig["compilerOptions"]["baseUrl"] ??= options.projectRoot;
  tsConfig["compilerOptions"]["paths"] ??= {};
  tsConfig["compilerOptions"]["paths"]["@/*"] ??= [];

  const srcPath = path.join(options.projectRoot, options.srcPath, "*");

  const paths = tsConfig["compilerOptions"]["paths"]["@/*"] as string[]
  if (!paths.includes(srcPath)) {
    paths.push(srcPath);
    tsConfig["compilerOptions"]["paths"]["@/*"] = paths;
  }

  writeJson(tree, tsConfigPath, tsConfig);
}


export default featureGenerator;

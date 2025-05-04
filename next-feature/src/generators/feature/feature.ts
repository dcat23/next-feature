import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles, OverwriteStrategy, readJson,
  Tree, writeJson
} from '@nx/devkit';
import { writeToDotenv } from 'next-feature/src/lib/dot-env';
import { ZOD_VERSION } from '../../lib/constants';
import axiosGenerator from '../../generators/axios/axios';
import * as path from 'path';
import { FeatureGeneratorSchema, type NormalizedFeatureGeneratorSchema } from './schema';


function normalize(options: FeatureGeneratorSchema): NormalizedFeatureGeneratorSchema {
  options.name ??= 'features';
  options.directory ??= "."
  options.srcPath ??= "src"

  const projectRoot = `${options.directory}`;
  const sourceRoot = path.join(projectRoot, options.srcPath);

  return {
    ...options,
    projectRoot,
    sourceRoot,
  }
}

export async function featureGenerator(
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

  const dependencies: Record<string, string> = {
    zod: ZOD_VERSION
  };
  const devDependencies: Record<string, string> = {

  };

  const projectRoot = normalizedOptions.projectRoot;

  // generateFiles(
  //   tree,
  //   path.join(__dirname, 'files/root'),
  //   normalizedOptions.projectRoot,
  //   {
  //     ...normalizedOptions,
  //     tmpl: "",
  //     overwriteStrategy: OverwriteStrategy.ThrowIfExisting
  //   }
  // );
  //



  if (normalizedOptions.useAxios) {
    await axiosGenerator(tree, {
      featureProject: normalizedOptions.name,
      skipFormat: true
    })
  }

  const dotenvEntries: Record<string, string> = {
    'BACKEND_API_URL': "http://localhost:8080"
  };
  writeToDotenv(tree, normalizedOptions, dotenvEntries, "example")

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

import {
  CreateNodesContextV2,
  createNodesFromFiles,
  CreateNodesV2,
  type ProjectConfiguration,
  readJsonFile,
} from '@nx/devkit';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';

// Expected format of the plugin options defined in nx.json
export interface FeaturePluginOptions {
  useSrc?: boolean;
  devTargetName?: string;
}

// File glob to find all the configuration files for this plugin
const FeatureConfigGlob = '**/project.json';

// Entry function that Nx calls to modify the graph
export const createNodesV2: CreateNodesV2<FeaturePluginOptions> = [
  FeatureConfigGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        createNodesInternal(configFile, options, context),
      configFiles,
      options,
      context
    );
  },
];

async function createNodesInternal(
  configFilePath: string,
  options: FeaturePluginOptions,
  context: CreateNodesContextV2
) {
  const projectRoot = dirname(configFilePath);

  // Do not create a project if package.json or project.json isn't there.
  const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
  if (
    !siblingFiles.includes('package.json') &&
    !siblingFiles.includes('project.json')
  ) {
    return {};
  }

  // Project configuration to be merged into the rest of the Nx configuration
  const projectConfiguration: ProjectConfiguration = readJsonFile(configFilePath);
  return {
    projects: {
      [projectRoot]: {
        ...projectConfiguration,
        // Additional configuration as necessary
      },
    },
  };
}

export { initGenerator as featureInitGenerator } from "./generators/init/init"
export { axiosGenerator as featureAxiosGenerator } from "./generators/misc/axios/axios"
export { presetGenerator as featurePresetGenerator } from "./generators/preset/preset"
export * as constants from "./lib/constants"

#!/usr/bin/env node

import type { CreateWorkspaceOptions } from 'create-nx-workspace';
import { createWorkspace } from 'create-nx-workspace';
import type { NxCloud } from 'create-nx-workspace/src/utils/nx/nx-cloud.js';
import {
  type PackageManager,
  packageManagerList,
} from 'create-nx-workspace/src/utils/package-manager.js';
import yargs, { Argv } from 'yargs';

const presetVersion = require('../package.json').version;


export interface WorkspaceOptions extends CreateWorkspaceOptions {
}

export async function promptWorkspaceOptions(args: string[]) {
  const argv =  yargs(args) as unknown as Argv<WorkspaceOptions>
  return argv
    .command('<name>', 'Create a workspace with next features', (yargs) => {
      yargs.positional('name', {
        describe: 'The name of the application',
        type: 'string',
        demandOption: true,
      })
    }, (argv) => {
      if (!/^[a-zA-Z][^:]*$/.test(argv.name as string)) {
        throw new Error('Invalid name pattern');
      }
    })
    .option("nxCloud", {
      alias: "ci",
      type: "string",
      choices: ['yes', 'github', 'gitlab', 'azure', 'bitbucket-pipelines', 'circleci', 'skip'],
      default: "skip"
    })
    .option("packageManager", {
      alias: "pm",
      choices: [...packageManagerList].sort(),
      type: "string",
      default: "pnpm"
    })
    .option("useGithub", {
      type: "boolean",
      default: true
    })
    .option("skipGit", {
      type: "boolean",
      default: false
    })
    .version(presetVersion)
    .parse();
}


async function main() {
  const {_, ...options} = await promptWorkspaceOptions(process.argv.slice(2));
  const name = _[0] as string;
  const packageManager = (options['packageManager']
    ?? options['package-manager']
    ?? options['pm']
    ?? 'pnpm'
  ) as PackageManager;
  const nxCloud = (options['nxCloud']
    ?? options['nx-cloud']
    ?? options['ci']
    ?? 'skip'
  ) as NxCloud;

  // This assumes "next-feature" and "create-next-feature" are at the same version
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const presetVersion = require('../package.json').version;

  // TODO: update below to customize the workspace
  const { directory } = await createWorkspace(`next-feature@${presetVersion}`, {
    skipGit: options.skipGit,
    useGithub: options.useGithub,
    name,
    nxCloud,
    packageManager
  });

  console.log(`Successfully created the workspace: ${directory}.`);
}

main();

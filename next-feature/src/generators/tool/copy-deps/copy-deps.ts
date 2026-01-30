import { readJson } from '@nx/devkit';
import { addDependenciesToPackageJson } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import * as path from 'node:path';
import { CopyDepsGeneratorSchema } from './schema';

export async function copyDepsGenerator(
  tree: Tree,
  options: CopyDepsGeneratorSchema
) {
  const packageJson = readJson(
    tree,
    path.join(options.directory, 'package.json')
  );

  if (!packageJson) {
    throw new Error('No package.json found');
  }

  const dependencies: Record<string, string> = {
    ...packageJson['dependencies'],
  };
  const devDependencies: Record<string, string> = {
    ...packageJson['devDependencies'],
  };
  // logger.debug({ dependencies, devDependencies });

  return addDependenciesToPackageJson(
    tree,
    dependencies,
    devDependencies,
    undefined,
    !options.replaceExisting
  );
}

export default copyDepsGenerator;

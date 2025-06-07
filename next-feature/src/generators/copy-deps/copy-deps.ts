import { logger } from '@nx/devkit';
import { addDependenciesToPackageJson } from '@nx/devkit';
import { Tree } from '@nx/devkit';
import { readPackageJson } from 'nx/src/project-graph/file-utils';
import { CopyDepsGeneratorSchema } from './schema';

export async function copyDepsGenerator(
  tree: Tree,
  options: CopyDepsGeneratorSchema
) {
  const packageJson = readPackageJson(options.directory);

  logger.debug(packageJson);

  if (!packageJson) {
    throw new Error('No package.json found');
  }

  const dependencies =
    packageJson['dependencies'] ?? ({} as Record<string, string>);
  const devDependencies =
    packageJson['devDependencies'] ?? ({} as Record<string, string>);

  return addDependenciesToPackageJson(
    tree,
    dependencies,
    devDependencies,
    undefined,
    true
  );
}

export default copyDepsGenerator;

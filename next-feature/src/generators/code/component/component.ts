import { formatFiles, generateFiles, names, Tree } from '@nx/devkit';
import * as path from 'path';
import type { NormalizedComponentGeneratorSchema } from './schema';
import { ComponentGeneratorSchema } from './schema';
import { initializeCodeGenerator } from '../../../lib/utils/code-generator';
import { exportFile } from '../../../lib/export-file';
import { handleComponentPackage } from './lib/utils';

function normalize(
  options: ComponentGeneratorSchema
): NormalizedComponentGeneratorSchema {
  options.componentType ??= 'component';
  const mutatedNames = names(options.name);
  const outputFileName = mutatedNames.fileName;
  handleComponentPackage(options)

  return {
    tmpl: '',
    ...options,
    names: mutatedNames,
    outputFileName
  };
}

export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema
) {

  const normalizedOptions = normalize(options);
  const { directory, sourceRoot } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'component'
  );

  generateFiles(tree, path.join(__dirname, 'files', normalizedOptions.componentType), directory, normalizedOptions);

  if (normalizedOptions.export) {
    const exportPath = path.join(
      normalizedOptions.package ?? 'components',
      normalizedOptions.outputFileName.replace(/\.tsx$/, '')
    ).split(path.sep).join('/');

    await exportFile(tree, sourceRoot, exportPath);
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

export default componentGenerator;

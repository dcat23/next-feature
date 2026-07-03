import { formatFiles, generateFiles, names, Tree } from '@nx/devkit';
import * as path from 'path';
import type { NormalizedComponentGeneratorSchema } from './schema';
import { ComponentGeneratorSchema } from './schema';
import { handleExportPath, initializeCodeGenerator, normalizeCodeGenerator } from '../../../lib/utils/code-generator';
import { exportFile } from '../../../lib/export-file';
import { handleComponentPackage } from './lib/utils';

function normalize(
  options: ComponentGeneratorSchema
): NormalizedComponentGeneratorSchema {
  options.componentType ??= 'component';
  // Must run before normalizeCodeGenerator, which unconditionally defaults
  // `package` to 'lib' and would otherwise make this per-type default a no-op.
  handleComponentPackage(options)

  const normalized = normalizeCodeGenerator(options)
  const mutatedNames = names(normalized.name);
  const isHook = normalized.componentType === 'hook';

  normalized.outputFileName = isHook
    ? (mutatedNames.fileName.startsWith('use-') ? mutatedNames.fileName : `use-${mutatedNames.fileName}`)
    : mutatedNames.fileName;
  normalized.exportPath = handleExportPath(normalized)

  return {
    tmpl: '',
    ...normalized,
    names: mutatedNames,
    hookName: isHook ? `use${mutatedNames.className}` : undefined,
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
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath);
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

export default componentGenerator;

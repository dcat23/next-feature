import { formatFiles, generateFiles, logger, names, Tree } from '@nx/devkit';
import * as path from 'path';
import type { NormalizedComponentGeneratorSchema } from './schema';
import { ComponentGeneratorSchema } from './schema';
import { handleExportPath, initializeCodeGenerator, normalizeCodeGenerator } from '../../../lib/utils/code-generator';
import { exportFile } from '../../../lib/export-file';
import { runShadcnCli } from '../../../lib/utils/shadcn';
import { handleComponentPackage } from './lib/utils';

const KINDS_BY_TYPE: Record<ComponentGeneratorSchema['componentType'], string[]> = {
  component: ['generic', 'modal', 'card', 'form'],
  page: ['generic', 'layout', 'loading', 'error', 'not-found', 'template', 'default', 'global-error', 'route'],
  ui: ['generic'],
};

function normalize(
  options: ComponentGeneratorSchema
): NormalizedComponentGeneratorSchema {
  options.componentType ??= 'component';

  if (options.kind && !KINDS_BY_TYPE[options.componentType].includes(options.kind)) {
    logger.warn(
      `component: kind "${options.kind}" is not valid for componentType "${options.componentType}"; using default "generic"`
    );
    options.kind = 'generic';
  } else {
    options.kind ??= 'generic';
  }
  options.inferPath = Boolean(options.inferPath);

  // Must run before normalizeCodeGenerator, which unconditionally defaults
  // `package` to 'lib' and would otherwise make this per-type default a no-op.
  handleComponentPackage(options)

  const normalized = normalizeCodeGenerator(options)
  const mutatedNames = names(normalized.name);

  normalized.outputFileName = mutatedNames.fileName;
  normalized.exportPath = handleExportPath(normalized)

  return {
    ...normalized,
    names: mutatedNames,
    kind: options.kind as NonNullable<ComponentGeneratorSchema['kind']>,
  };
}

export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema
) {

  const normalizedOptions = normalize(options);
  const { directory, sourceRoot, projectRoot, projectName } = await initializeCodeGenerator(
    tree,
    normalizedOptions,
    'component'
  );

  if (normalizedOptions.componentType === 'ui') {
    const slug = normalizedOptions.names.fileName;
    const componentPath = path.join(directory, `${slug}.tsx`);

    if (normalizedOptions.export) {
      await exportFile(tree, sourceRoot, normalizedOptions.exportPath);
    }

    if (!normalizedOptions.skipFormat) await formatFiles(tree);

    if (tree.exists(componentPath)) {
      logger.info(`component: ${slug} already exists in ${projectName}, skipping shadcn add`);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }

    return () => {
      const { success } = runShadcnCli(projectRoot, `add ${slug} --yes`);
      if (!success) {
        throw new Error(`Failed to add shadcn component "${slug}"`);
      }
    };
  }

  generateFiles(tree, path.join(__dirname, 'files', normalizedOptions.componentType, normalizedOptions.kind), directory, normalizedOptions);

  if (normalizedOptions.export) {
    await exportFile(tree, sourceRoot, normalizedOptions.exportPath);
  }

  if (!normalizedOptions.skipFormat) await formatFiles(tree);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

export default componentGenerator;

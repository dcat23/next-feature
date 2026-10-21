import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, addProjectConfiguration, readProjectConfiguration } from '@nx/devkit';
import { declarationGenerator } from './declaration';
import { DeclarationGeneratorSchema } from './schema';

describe('declaration generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('kind: constant', () => {
    const options: DeclarationGeneratorSchema = {
      projectName: 'test',
      name: 'test',
      kind: 'constant',
    };

    it('should run successfully', async () => {
      await declarationGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'test');
      expect(config).toBeDefined();
    });

    it('should generate files', async () => {
      await declarationGenerator(tree, options);
      const file = 'features/test/src/lib/constants/index.ts';
      const buffer = tree.read(file, 'utf-8') ?? '';
      expect(tree.exists(file)).toBeTruthy();
      expect(buffer.includes('const TEST: Test = null')).toBeTruthy();
    });

    it('should generate in separate file', async () => {
      await declarationGenerator(tree, { ...options, file: 'data' });
      const file = 'features/test/src/lib/constants/data.ts';
      const buffer = tree.read(file, 'utf-8') ?? '';
      expect(tree.exists(file)).toBeTruthy();
      expect(buffer.includes('const TEST: Test = null')).toBeTruthy();
    });
  });

  describe('kind: data-type', () => {
    const options: DeclarationGeneratorSchema = {
      projectName: 'test',
      name: 'test',
      kind: 'data-type',
    };

    it('should run successfully', async () => {
      await declarationGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'test');
      expect(config).toBeDefined();
    });

    it('should generate files', async () => {
      await declarationGenerator(tree, options);
      const file = 'features/test/src/lib/types/index.ts';
      const buffer = tree.read(file, 'utf-8') ?? '';
      expect(tree.exists(file)).toBeTruthy();
      expect(buffer.includes('interface Test')).toBeTruthy();
    });
  });

  describe('kind: utility', () => {
    const options: DeclarationGeneratorSchema = {
      projectName: 'test',
      name: 'test',
      kind: 'utility',
    };

    it('should run successfully', async () => {
      await declarationGenerator(tree, options);
      const config = readProjectConfiguration(tree, 'test');
      expect(config).toBeDefined();
    });

    it('should generate files', async () => {
      await declarationGenerator(tree, options);
      const file = 'features/test/src/lib/utils/index.ts';
      const buffer = tree.read(file, 'utf-8') ?? '';
      expect(tree.exists(file)).toBeTruthy();
      expect(buffer.includes('function test')).toBeTruthy();
    });
  });

  describe('export', () => {
    const read = (file: string) => tree.read(file, 'utf-8') ?? '';

    it.each([
      ['data-type', 'index', './lib/types/index'],
      ['constant', 'index', './lib/constants/index'],
      ['utility', 'server', './lib/utils/index'],
    ] as const)('should export %s declarations from %s.ts', async (kind, target, exportPath) => {
      await declarationGenerator(tree, { projectName: 'test', name: 'test', kind, export: true, skipFormat: true });
      const other = target === 'index' ? 'server' : 'index';
      expect(read(`features/test/src/${target}.ts`)).toContain(`export * from '${exportPath}';`);
      expect(read(`features/test/src/${other}.ts`)).not.toContain(exportPath);
    });

    it('should not export from an application', async () => {
      addProjectConfiguration(tree, 'web', { root: 'apps/web', sourceRoot: 'apps/web/src', projectType: 'application' });
      await declarationGenerator(tree, { projectName: 'web', name: 'test', kind: 'data-type', export: true, skipFormat: true });
      expect(tree.exists('apps/web/src/lib/types/index.ts')).toBeTruthy();
      expect(tree.exists('apps/web/src/index.ts')).toBeFalsy();
    });
  });
});

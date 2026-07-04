import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, logger, readProjectConfiguration } from '@nx/devkit';
import { componentGenerator } from './component';
import { ComponentGeneratorSchema } from './schema';
describe('component generator', () => {
  let tree: Tree;
  const defaultOptions: ComponentGeneratorSchema = {
    projectName: 'base',
    name: 'test-component',
    componentType: 'component',
  };
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });
  it('should run successfully', async () => {
    await componentGenerator(tree, { ...defaultOptions });
    const config = readProjectConfiguration(tree, 'base');
    expect(config).toBeDefined();
  });
  it('should generate default component file', async () => {
    await componentGenerator(tree, { ...defaultOptions });
    const file = 'features/base/src/components/test-component.tsx';
    expect(tree.exists(file)).toBeTruthy();
  });
  it('should generate modal component', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'confirm',
      componentType: 'modal',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/components/confirm-modal.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('isOpen');
    expect(content).toContain('onClose');
  });
  it('should generate card component', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'info',
      componentType: 'card',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/components/info-card.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('title');
    expect(content).toContain('footer');
  });
  it('should generate form component', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'login',
      componentType: 'form',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/components/login-form.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('useActionState');
    expect(content).toContain('action');
    expect(content).toContain('initialState');
  });
  it('should generate provider component', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'theme',
      componentType: 'provider',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/components/theme-provider.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('createContext');
    expect(content).toContain('Provider');
    expect(content).toContain('useTheme');
  });
  it('should generate page component in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'dashboard',
      componentType: 'page',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/page.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('async function DashboardPage');
  });
  it('should generate layout component in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'admin-layout',
      componentType: 'layout',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/layout.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('function AdminLayoutLayout');
    expect(content).toContain('children');
  });

  it('should infer nested route path from name when package is "*"', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'UserResourceFiles',
      componentType: 'page',
      package: '*',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/user/resource/files/page.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('async function UserResourceFilesPage');
  });

  it('should generate a hook in the hooks package with a use- prefixed file and export', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'toggle',
      componentType: 'hook',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/hooks/use-toggle.ts';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('export function useToggle');
    expect(content).toContain('export default useToggle');
  });

  it('should not double-prefix a hook name that already starts with use', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'use-toggle',
      componentType: 'hook',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/hooks/use-toggle.ts';
    expect(tree.exists(file)).toBeTruthy();
  });
});

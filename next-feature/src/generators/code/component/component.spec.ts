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
      componentType: 'component',
      kind: 'modal',
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
      componentType: 'component',
      kind: 'card',
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
      componentType: 'component',
      kind: 'form',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/components/login-form.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('useActionState');
    expect(content).toContain('action');
    expect(content).toContain('initialState');
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
      componentType: 'page',
      kind: 'layout',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/layout.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('function AdminLayoutLayout');
    expect(content).toContain('children');
  });
  it('should generate loading component in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'dashboard',
      componentType: 'page',
      kind: 'loading',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/loading.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('function DashboardLoading');
  });
  it('should generate error component in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'dashboard',
      componentType: 'page',
      kind: 'error',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/error.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain("'use client'");
    expect(content).toContain('reset');
  });
  it('should generate not-found component in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'dashboard',
      componentType: 'page',
      kind: 'not-found',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/not-found.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('function DashboardNotFound');
  });
  it('should generate template component in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'dashboard',
      componentType: 'page',
      kind: 'template',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/template.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('function DashboardTemplate');
    expect(content).toContain('children');
  });
  it('should generate default component in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'dashboard',
      componentType: 'page',
      kind: 'default',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/default.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('function DashboardDefault');
  });
  it('should generate global-error component in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'dashboard',
      componentType: 'page',
      kind: 'global-error',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/global-error.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain("'use client'");
    expect(content).toContain('<html>');
    expect(content).toContain('reset');
  });
  it('should generate route handler in the app directory', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'health',
      componentType: 'page',
      kind: 'route',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/route.ts';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('export async function GET');
    expect(content).toContain('NextResponse');
  });

  it('should infer nested route path from name when inferPath is set', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'UserResourceFiles',
      componentType: 'page',
      inferPath: true,
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/user/resource/files/page.tsx';
    expect(tree.exists(file)).toBeTruthy();
    const content = tree.read(file, 'utf-8');
    expect(content).toContain('async function UserResourceFilesPage');
  });

  it('should default kind to "generic" for componentType "component"', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'test-component',
      componentType: 'component',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/components/test-component.tsx';
    expect(tree.exists(file)).toBeTruthy();
  });

  it('should default kind to "generic" for componentType "page"', async () => {
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'dashboard',
      componentType: 'page',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/app/page.tsx';
    expect(tree.exists(file)).toBeTruthy();
  });

  it('should warn and fall back to "generic" when kind does not belong to componentType', async () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation();
    const options: ComponentGeneratorSchema = {
      ...defaultOptions,
      name: 'test-component',
      componentType: 'component',
      kind: 'layout',
    };
    await componentGenerator(tree, options);
    const file = 'features/base/src/components/test-component.tsx';
    expect(tree.exists(file)).toBeTruthy();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('kind "layout" is not valid for componentType "component"')
    );
    warnSpy.mockRestore();
  });
});

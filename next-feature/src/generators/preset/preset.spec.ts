import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, getProjects } from '@nx/devkit';
import { presetGenerator } from './preset';
import { PresetGeneratorSchema } from './schema';
describe('preset generator', () => {
  let tree: Tree;
  const options: PresetGeneratorSchema = {
    name: 'test',
    skipFormat: true,
  };
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });
  it('should generate root workspace files', async () => {
    await presetGenerator(tree, options);
    expect(tree.read('README.md', 'utf-8')).toContain('# test');
    expect(tree.exists('tailwind.base.config.js')).toBeTruthy();
  });
  it('should gitignore env files except .env.example', async () => {
    await presetGenerator(tree, options);
    const gitignore = tree.read('.gitignore', 'utf-8');
    expect(gitignore).toContain('.env*');
    expect(gitignore).toContain('!.env.example');
  });
  // Scaffolding an application here makes create-next-feature far slower
  // (dependency install, formatting), so the preset only writes root files
  it('should not generate an application', async () => {
    await presetGenerator(tree, options);
    expect(getProjects(tree).size).toBe(0);
    expect(tree.exists('apps/test')).toBeFalsy();
  });
});

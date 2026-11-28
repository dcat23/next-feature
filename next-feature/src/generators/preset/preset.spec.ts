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
    // Tailwind CSS v4 is configured in each app's CSS
    expect(tree.exists('tailwind.base.config.js')).toBeFalsy();
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
  it('should write the CI workflow unless ci is false', async () => {
    await presetGenerator(tree, options);
    expect(tree.read('.github/workflows/ci.yml', 'utf-8')).toContain('affected -t lint test build');
    expect(tree.exists('.nvmrc')).toBe(true);

    const other = createTreeWithEmptyWorkspace();
    await presetGenerator(other, { ...options, ci: false });
    expect(other.exists('.github/workflows/ci.yml')).toBe(false);
  });
});

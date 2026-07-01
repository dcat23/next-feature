import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { updateEnvConfig } from './env-config';

describe('updateEnvConfig', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  function envConfig() {
    return tree.read('lib/config/env.ts', 'utf-8');
  }

  it('creates env.ts with a schema entry and matching accessor', () => {
    updateEnvConfig(tree, '', { set: { API_URL: 'z.string().url()' } });

    const text = envConfig();
    expect(text).toContain('API_URL: z.string().url(),');
    expect(text).toContain('export const API_URL = process.env.API_URL;');
  });

  it('updates an existing key in place instead of duplicating it', () => {
    updateEnvConfig(tree, '', { set: { API_URL: 'z.string()' } });
    updateEnvConfig(tree, '', { set: { API_URL: 'z.string().url()' } });

    const text = envConfig();
    expect(text.match(/API_URL:/g)).toHaveLength(1);
    expect(text.match(/export const API_URL/g)).toHaveLength(1);
    expect(text).toContain('API_URL: z.string().url(),');
  });

  it('accumulates additional keys across separate calls', () => {
    updateEnvConfig(tree, '', { set: { API_URL: 'z.string().url()' } });
    updateEnvConfig(tree, '', { set: { AUTH_SECRET: 'z.string()' } });

    const text = envConfig();
    expect(text).toContain('API_URL: z.string().url(),');
    expect(text).toContain('AUTH_SECRET: z.string(),');
    expect(text).toContain('export const API_URL = process.env.API_URL;');
    expect(text).toContain('export const AUTH_SECRET = process.env.AUTH_SECRET;');
  });

  it('removes both the schema entry and the accessor on unset', () => {
    updateEnvConfig(tree, '', { set: { API_URL: 'z.string().url()' } });
    updateEnvConfig(tree, '', { unset: ['API_URL'] });

    const text = envConfig();
    expect(text).not.toContain('API_URL');
  });

  it('throws when the target file exists but is missing the marker comments', () => {
    tree.write('lib/config/env.ts', 'export const NODE_ENV = process.env.NODE_ENV;\n');

    expect(() =>
      updateEnvConfig(tree, '', { set: { API_URL: 'z.string()' } })
    ).toThrow();
  });
});

import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { syncDotenv, updateDotenv } from './dot-env';

describe('updateDotenv', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('sets a variable in both .env and .env.example', () => {
    updateDotenv(
      tree,
      { projectRoot: '' },
      { set: { BACKEND_API_URL: 'http://localhost:8080' } }
    );

    expect(tree.read('.env', 'utf-8')).toContain(
      'BACKEND_API_URL=http://localhost:8080'
    );
    expect(tree.read('.env.example', 'utf-8')).toContain(
      'BACKEND_API_URL=http://localhost:8080'
    );
  });

  it('groups the variable under the requested section', () => {
    updateDotenv(
      tree,
      { projectRoot: '', section: 'axios' },
      { set: { BACKEND_API_URL: 'http://localhost:8080' } }
    );

    const dotenv = tree.read('.env', 'utf-8');
    expect(dotenv).toContain('### AXIOS ###');
    expect(dotenv).toContain('BACKEND_API_URL=http://localhost:8080');
  });

  it('updates an existing key in place instead of duplicating it', () => {
    updateDotenv(tree, { projectRoot: '' }, { set: { API_URL: 'http://a' } });
    updateDotenv(tree, { projectRoot: '' }, { set: { API_URL: 'http://b' } });

    const dotenv = tree.read('.env', 'utf-8');
    expect(dotenv.match(/API_URL=/g)).toHaveLength(1);
    expect(dotenv).toContain('API_URL=http://b');
  });

  it('leaves an existing value untouched when skipExisting is true', () => {
    updateDotenv(tree, { projectRoot: '' }, { set: { API_URL: 'http://a' } });
    updateDotenv(
      tree,
      { projectRoot: '' },
      { set: { API_URL: 'http://b' }, skipExisting: true }
    );

    const dotenv = tree.read('.env', 'utf-8');
    expect(dotenv.match(/API_URL=/g)).toHaveLength(1);
    expect(dotenv).toContain('API_URL=http://a');
  });

  it('removes a variable via unset', () => {
    updateDotenv(tree, { projectRoot: '' }, { set: { API_URL: 'http://a' } });
    updateDotenv(tree, { projectRoot: '' }, { unset: ['API_URL'] });

    expect(tree.read('.env', 'utf-8')).not.toContain('API_URL');
  });

  it('drops a section header entirely once its last property is unset', () => {
    updateDotenv(
      tree,
      { projectRoot: '', section: 'axios' },
      { set: { API_URL: 'http://a' } }
    );
    updateDotenv(
      tree,
      { projectRoot: '', section: 'axios' },
      { unset: ['API_URL'] }
    );

    expect(tree.read('.env', 'utf-8')).not.toContain('### AXIOS ###');
  });

  it('round-trips comments and blank lines untouched', () => {
    tree.write(
      '.env',
      ['# a hand-written comment', '', 'EXISTING=1', ''].join('\n')
    );

    updateDotenv(tree, { projectRoot: '' }, { set: { NEW_VAR: 'value' } });

    const dotenv = tree.read('.env', 'utf-8');
    expect(dotenv).toContain('# a hand-written comment');
    expect(dotenv).toContain('EXISTING=1');
    expect(dotenv).toContain('NEW_VAR=value');
  });

  it('only touches the .env.<suffix> files explicitly requested', () => {
    updateDotenv(
      tree,
      { projectRoot: '', files: ['local'] },
      { set: { API_URL: 'http://a' } }
    );

    expect(tree.read('.env.local', 'utf-8')).toContain('API_URL=http://a');
    expect(tree.exists('.env.prod')).toBe(false);
  });

  it('discovers every existing .env* file when files is "all"', () => {
    tree.write('.env.local', '');
    tree.write('.env.prod', '');

    updateDotenv(
      tree,
      { projectRoot: '', files: 'all' },
      { set: { API_URL: 'http://a' } }
    );

    expect(tree.read('.env', 'utf-8')).toContain('API_URL=http://a');
    expect(tree.read('.env.example', 'utf-8')).toContain('API_URL=http://a');
    expect(tree.read('.env.local', 'utf-8')).toContain('API_URL=http://a');
    expect(tree.read('.env.prod', 'utf-8')).toContain('API_URL=http://a');
  });

  it('gitignores every written file except .env.example, without duplicates on rerun', () => {
    updateDotenv(
      tree,
      { projectRoot: '', files: ['local'] },
      { set: { API_URL: 'http://a' } }
    );
    updateDotenv(
      tree,
      { projectRoot: '', files: ['local'] },
      { set: { API_URL: 'http://b' } }
    );

    const gitignore = tree.read('.gitignore', 'utf-8');
    expect(gitignore.match(/^\.env$/gm)).toHaveLength(1);
    expect(gitignore.match(/^\.env\.local$/gm)).toHaveLength(1);
    expect(gitignore).not.toContain('.env.example');
  });
});

describe('syncDotenv', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('applies the same change to every project root', () => {
    syncDotenv(
      tree,
      ['apps/web', 'features/users'],
      {},
      { set: { API_URL: 'http://a' } }
    );

    expect(tree.read('apps/web/.env', 'utf-8')).toContain('API_URL=http://a');
    expect(tree.read('features/users/.env', 'utf-8')).toContain(
      'API_URL=http://a'
    );
  });
});

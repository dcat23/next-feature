import { logger, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { writeToDotenv } from './dot-env';
describe('dot env', () => {
  let tree: Tree;
  let entries: Record<string, string>;
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    entries = {
      BACKEND_API_URL: 'http://localhost:8080',
    };
  });
  it('should run successfully', async () => {
    writeToDotenv(tree, { projectRoot: '' }, entries);
    const dotenv = tree.read('.env', 'utf-8');
    expect(
      dotenv.includes('BACKEND_API_URL="http://localhost:8080"')
    ).toBeTruthy();
  });
  it('should add section', async () => {
    writeToDotenv(tree, { projectRoot: '', section: 'api' }, entries);
    const dotenv = tree.read('.env', 'utf-8');
    logger.info({
      fn: 'test#should-add-section',
      message: {
        dotenv,
      },
    });
    expect(dotenv.includes('# API')).toBeTruthy();
  });
});

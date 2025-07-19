import { logger } from '@nx/devkit';
import { writeJson } from '@nx/devkit';
import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { copyDepsGenerator } from './copy-deps';
import { CopyDepsGeneratorSchema } from './schema';

describe('copy-deps generator', () => {
  let tree: Tree;
  const options: CopyDepsGeneratorSchema = { directory: 'test' };

  let packageJson: any = {};

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    packageJson['dependencies'] = {
      'test-lib': '0.0.1',
    } as Record<string, string>;

    writeJson(tree, 'test/package.json', packageJson);
  });

  afterEach(() => {
    packageJson = {};
    tree.delete('test/package.json');
  });


  it('should copy dependencies', async () => {
    await copyDepsGenerator(tree, options);

    const jsonString = tree.read('package.json', 'utf-8');

    expect(jsonString.includes("test-lib"))
  });
});

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration, logger } from '@nx/devkit';

import { featureGenerator } from './feature';
import { FeatureGeneratorSchema } from './schema';

describe('feature generator', () => {
  let tree: Tree;
  const options: FeatureGeneratorSchema = {};

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await featureGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'features');
    expect(config).toBeDefined();
  });


  it('should generate files', async () => {
    await featureGenerator(tree, options);
    const files = tree.children("src/lib")
    expect(
      files.some((file) => ["config.ts"]
        .includes(file))
    ).toBeTruthy();
  });

});

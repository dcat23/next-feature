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

  it('should write to .env.example', async () => {
    await featureGenerator(tree, options);

    const dotenv = tree.read('.env.example', "utf-8").toString();
    expect(dotenv.includes("BACKEND_API_URL")).toBeTruthy();
  });
});

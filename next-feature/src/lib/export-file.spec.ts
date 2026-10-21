import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { exportFile } from './export-file';

describe('exportFile', () => {
  let tree: Tree;
  const sourceRoot = 'features/test/src';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add server-only import when exporting to server.ts', async () => {
    tree.write(`${sourceRoot}/server.ts`, '');
    await exportFile(tree, sourceRoot, 'lib/actions/user', 'server');

    const content = tree.read(`${sourceRoot}/server.ts`, 'utf-8');
    expect(content).toBe(
      "import 'server-only';\n\nexport * from './lib/actions/user';\n"
    );
  });

  it('should not duplicate an existing server-only import', async () => {
    tree.write(
      `${sourceRoot}/server.ts`,
      "import 'server-only';\n\nexport * from './lib/actions/a';\n"
    );
    await exportFile(tree, sourceRoot, 'lib/actions/b', 'server');

    const content = tree.read(`${sourceRoot}/server.ts`, 'utf-8');
    expect(content.match(/server-only/g)).toHaveLength(1);
    expect(content).toContain("export * from './lib/actions/a';");
    expect(content).toContain("export * from './lib/actions/b';");
  });

  it('should add server-only to an existing server.ts even when the export already exists', async () => {
    tree.write(`${sourceRoot}/server.ts`, "export * from './lib/actions/user';\n");
    await exportFile(tree, sourceRoot, 'lib/actions/user', 'server');

    const content = tree.read(`${sourceRoot}/server.ts`, 'utf-8');
    expect(content).toBe(
      "import 'server-only';\n\nexport * from './lib/actions/user';\n"
    );
  });

  it('should not add server-only when exporting to index.ts', async () => {
    await exportFile(tree, sourceRoot, 'lib/types/user');

    const content = tree.read(`${sourceRoot}/index.ts`, 'utf-8');
    expect(content).toBe("export * from './lib/types/user';\n");
  });
});

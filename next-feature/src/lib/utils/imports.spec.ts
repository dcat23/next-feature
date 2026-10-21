import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { addNamedImports } from './imports';

describe('addNamedImports', () => {
  let tree: Tree;
  const file = 'src/a.ts';
  const read = () => tree.read(file, 'utf-8');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should create the import in an empty file', () => {
    addNamedImports(tree, file, 'zod', ['z']);
    expect(read()).toBe("import { z } from 'zod';\n");
  });

  it('should insert after the last import', () => {
    tree.write(file, "import 'server-only';\n\nimport api from '../config/client';\n\nconst a = 1;\n");
    addNamedImports(tree, file, '../types/user', ['type UserRequest']);
    expect(read()).toBe(
      "import 'server-only';\n\nimport api from '../config/client';\nimport { type UserRequest } from '../types/user';\n\nconst a = 1;\n"
    );
  });

  it('should insert after a directive when there are no imports', () => {
    tree.write(file, "'use server';\n");
    addNamedImports(tree, file, './user', ['getUsers']);
    expect(read()).toBe("'use server';\n\nimport { getUsers } from './user';\n");
  });

  it('should merge into an existing import from the same module', () => {
    tree.write(file, "import { a, type B } from './user';\n");
    addNamedImports(tree, file, './user', ['type B', 'c']);
    expect(read()).toBe("import { a, type B, c } from './user';\n");
  });

  it('should merge into a multi-line import', () => {
    tree.write(file, "import {\n  a,\n  b,\n} from './user';\n");
    addNamedImports(tree, file, './user', ['c']);
    expect(read()).toBe("import { a, b, c } from './user';\n");
  });

  it('should leave the file unchanged when all specifiers exist', () => {
    tree.write(file, "import {\n  a,\n} from './user';\n");
    addNamedImports(tree, file, './user', ['a']);
    expect(read()).toBe("import {\n  a,\n} from './user';\n");
  });

  it('should not match a module that only shares a prefix', () => {
    tree.write(file, "import { a } from './user.action';\n");
    addNamedImports(tree, file, './user', ['b']);
    expect(read()).toContain("import { a } from './user.action';");
    expect(read()).toContain("import { b } from './user';");
  });
});

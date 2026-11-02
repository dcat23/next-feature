import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { isShadcnBaseInstalled, resolveAliasFile } from './shadcn';

// Real files: a workspace laid out like Nx (paths relative to the root, in tsconfig.base.json)
describe('style base detection on disk', () => {
  let root: string;
  const write = (file: string, content: string) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  };

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'shadcn-base-'));
    write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@feature/ui': ['features/ui/src/index.ts'],
            '@feature/ui/*': ['features/ui/src/*'],
            '@app/web/*': ['apps/web/*'],
          },
        },
      })
    );
    write('apps/web/tsconfig.json', JSON.stringify({ extends: '../../tsconfig.base.json', compilerOptions: {} }));
    write(
      'apps/web/components.json',
      JSON.stringify({ tailwind: { css: 'app/global.css' }, aliases: { utils: '@app/web/lib/ui/utils' } })
    );
    write('apps/web/app/global.css', "@import 'tailwindcss';\n");
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('resolves an alias to its file through the workspace tsconfig paths', () => {
    write('features/ui/src/lib/ui/utils.ts', 'export { cn } from "cn"\n');
    expect(resolveAliasFile(path.join(root, 'features/ui'), '@feature/ui/lib/ui/utils')).toBe(
      path.join(root, 'features/ui/src/lib/ui/utils.ts')
    );
    expect(resolveAliasFile(path.join(root, 'features/ui'), '@feature/ui/lib/ui/missing')).toBeNull();
  });

  it('is not installed with only the generated CSS and no cn() helper', () => {
    expect(isShadcnBaseInstalled(path.join(root, 'apps/web'))).toBe(false);
  });

  it('is installed when cn() exists at the utils alias, even if the CSS changed', () => {
    write('apps/web/lib/ui/utils.ts', 'export { cn } from "cn"\n');
    expect(isShadcnBaseInstalled(path.join(root, 'apps/web'))).toBe(true);
  });

  it('is installed when the CSS has the base imports', () => {
    write('apps/web/app/global.css', "@import 'tailwindcss';\n@import \"shadcn/tailwind.css\";\n");
    expect(isShadcnBaseInstalled(path.join(root, 'apps/web'))).toBe(true);
  });

  it('is not installed after a component add without the base (only the component file)', () => {
    write('apps/web/components/ui/common/button.tsx', 'import { cn } from "cn"\n');
    expect(isShadcnBaseInstalled(path.join(root, 'apps/web'))).toBe(false);
  });

  it('works with a project root relative to the cwd', () => {
    write('apps/web/lib/ui/utils.ts', 'export { cn } from "cn"\n');
    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(isShadcnBaseInstalled('apps/web')).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });
});

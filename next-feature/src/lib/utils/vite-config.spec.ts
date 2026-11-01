import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, writeJson } from '@nx/devkit';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import {
  externalizeDeclaredDependencies,
  externalizeDeclaredDependenciesOnDisk,
  toUseClientBoundariesConfig,
} from './vite-config';

// Shape of the vite.config.mts written by @nx/next's library generator
const NX_VITE_CONFIG = `/// <reference types='vitest' />
import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig(() => ({
  root: import.meta.dirname,
  build: {
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'custom-undeclared'],
    },
  },
}));
`;

const ROOT = 'features/demo';
const CONFIG = `${ROOT}/vite.config.mts`;

/** Evaluates the generated isExternal against a given package.json. */
function loadIsExternal(config: string, pkg: object): (id: string) => boolean {
  const start = config.indexOf('const extraExternals');
  const end = config.indexOf('export default defineConfig(');
  const body = config
    .slice(start, end)
    .replace(/: string\[\]/g, '')
    .replace(/\(id: string\)/g, '(id)');
  return new Function(`const pkg = ${JSON.stringify(pkg)};\n${body}\nreturn isExternal;`)();
}

describe('externalizeDeclaredDependencies', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(CONFIG, NX_VITE_CONFIG);
    writeJson(tree, `${ROOT}/package.json`, {
      name: '@demo/demo',
      dependencies: { zod: '^3.24.4' },
      peerDependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    });
  });

  it('replaces the external array with a package.json-driven isExternal', () => {
    externalizeDeclaredDependencies(tree, ROOT);
    const config = tree.read(CONFIG, 'utf-8');
    expect(config).toContain('external: isExternal');
    expect(config).not.toMatch(/external:\s*\[/);
    expect(config).toContain("import * as path from 'path';\nimport { readFileSync } from 'fs';");
    expect(config).toContain("readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8')");
  });

  it('keeps previously external but undeclared entries as extraExternals, plus the given extras', () => {
    externalizeDeclaredDependencies(tree, ROOT, ['thread-stream']);
    // react, react-dom and react/jsx-runtime are covered by the react peers
    expect(tree.read(CONFIG, 'utf-8')).toContain(
      "const extraExternals: string[] = ['custom-undeclared', 'thread-stream'];"
    );
  });

  it('merges into extraExternals when run again, without duplicating the block', () => {
    externalizeDeclaredDependencies(tree, ROOT, ['thread-stream']);
    externalizeDeclaredDependencies(tree, ROOT, ['thread-stream', 'another']);
    const config = tree.read(CONFIG, 'utf-8');
    expect(config.match(/const isExternal/g)).toHaveLength(1);
    expect(config).toContain(
      "const extraExternals: string[] = ['custom-undeclared', 'thread-stream', 'another'];"
    );
  });

  it('leaves configs without an external array untouched', () => {
    tree.write(CONFIG, 'export default {};\n');
    externalizeDeclaredDependencies(tree, ROOT);
    expect(tree.read(CONFIG, 'utf-8')).toBe('export default {};\n');
  });

  describe('generated isExternal', () => {
    let isExternal: (id: string) => boolean;

    beforeEach(() => {
      externalizeDeclaredDependencies(tree, ROOT, ['thread-stream']);
      // package.json as it might look after `shadcn add`: read at build time
      isExternal = loadIsExternal(tree.read(CONFIG, 'utf-8'), {
        dependencies: { zod: '^3.24.4', '@radix-ui/react-dialog': '^1.1.0', 'next-auth': '5.0.0-beta.27' },
        peerDependencies: { react: '^19.0.0' },
      });
    });

    it.each([
      'zod',
      '@radix-ui/react-dialog',
      'react',
      'react/jsx-runtime',
      'next-auth/providers/github',
      'thread-stream',
    ])('externalizes %s', (id) => {
      expect(isExternal(id)).toBe(true);
    });

    it.each(['./lib/utils', '/abs/src/index.ts', 'react-dom', 'zodiac', '@radix-ui/react-dialogs'])(
      'bundles %s',
      (id) => {
        expect(isExternal(id)).toBe(false);
      }
    );
  });
});

describe('externalizeDeclaredDependenciesOnDisk', () => {
  let workspaceRoot: string;
  const config = () => readFileSync(path.join(workspaceRoot, CONFIG), 'utf-8');

  beforeEach(() => {
    workspaceRoot = mkdtempSync(path.join(tmpdir(), 'nf-vite-'));
    mkdirSync(path.join(workspaceRoot, ROOT), { recursive: true });
    writeFileSync(path.join(workspaceRoot, CONFIG), NX_VITE_CONFIG);
    // a ui feature generated before 0.2.0, after `shadcn add` installed into it
    writeFileSync(
      path.join(workspaceRoot, ROOT, 'package.json'),
      JSON.stringify({
        dependencies: { '@radix-ui/react-dialog': '^1.1.0' },
        peerDependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
      })
    );
  });

  afterEach(() => rmSync(workspaceRoot, { recursive: true, force: true }));

  it('converts a static external array, keeping undeclared entries as extras', () => {
    expect(externalizeDeclaredDependenciesOnDisk(workspaceRoot, ROOT)).toBe(true);
    expect(config()).toContain('external: isExternal');
    expect(config()).toContain("const extraExternals: string[] = ['custom-undeclared'];");
  });

  it('leaves an already converted config alone', () => {
    externalizeDeclaredDependenciesOnDisk(workspaceRoot, ROOT);
    const converted = config();
    expect(externalizeDeclaredDependenciesOnDisk(workspaceRoot, ROOT)).toBe(false);
    expect(config()).toBe(converted);
  });

  it('does nothing for projects without a vite config', () => {
    rmSync(path.join(workspaceRoot, CONFIG));
    expect(externalizeDeclaredDependenciesOnDisk(workspaceRoot, ROOT)).toBe(false);
  });
});

describe('toUseClientBoundariesConfig', () => {
  const config = [
    "import { defineConfig } from 'vite';",
    "import react from '@vitejs/plugin-react';",
    '',
    'export default defineConfig(() => ({',
    '  plugins: [',
    '    react(),',
    '  ],',
    '  build: {',
    '    rollupOptions: {',
    '      external: isExternal',
    '    },',
    '  },',
    '}));',
    '',
  ].join('\n');

  it('adds the plugin and preserveModules', () => {
    const next = toUseClientBoundariesConfig(config) ?? '';
    expect(next).toContain("import { defineConfig, type Plugin } from 'vite';");
    expect(next).toContain('    react(),\n    preserveUseClient(),');
    expect(next).toContain("name: 'preserve-use-client',");
    expect(next).toContain("output: { preserveModules: true, preserveModulesRoot: 'src' },");
    expect(next).toContain("if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning);");
    expect(next.indexOf('const preserveUseClient')).toBeLessThan(next.indexOf('export default defineConfig('));
  });

  it('is idempotent', () => {
    expect(toUseClientBoundariesConfig(toUseClientBoundariesConfig(config) ?? '')).toBeNull();
  });

  it('leaves configs of another shape untouched', () => {
    expect(toUseClientBoundariesConfig(config.replace('external: isExternal', "external: ['react']"))).toBeNull();
  });

  describe('generated plugin', () => {
    // Evaluate the USE_CLIENT pattern the plugin is generated with
    const pattern = (() => {
      const source = (toUseClientBoundariesConfig(config) ?? '').match(/const USE_CLIENT = (\/.*\/);/)?.[1] ?? '';
      return new Function(`return ${source}`)() as RegExp;
    })();

    it.each([
      ["'use client';\nexport const a = 1;"],
      ['"use client"\nexport const a = 1;'],
      ["// header\n'use client';\n"],
      ["/* license */\n'use client';\n"],
    ])('detects %j', (code) => {
      expect(pattern.test(code)).toBe(true);
    });

    it.each([["import 'server-only';\n'use client';"], ["const s = 'use client';"]])('ignores %j', (code) => {
      expect(pattern.test(code)).toBe(false);
    });
  });
});

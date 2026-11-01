/// <reference types='vitest' />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { readFileSync } from 'fs';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

// Everything declared in package.json (dependencies and peerDependencies)
// stays external, including subpath imports (react/jsx-runtime,
// next-auth/providers/github): it is installed alongside the published
// package instead of being bundled into dist/. Packages that must stay
// external without being declared go in extraExternals.
const pkg = JSON.parse(
  readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8'),
);
const extraExternals: string[] = [];
const externals = [
  ...Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }),
  ...extraExternals,
];
const isExternal = (id: string) =>
  externals.some((name) => id === name || id.startsWith(`${name}/`));

// Rollup drops module-level directives such as 'use client'. Keep every
// module in its own file (preserveModules) and put the directive back on the
// files whose source starts with it, so client components and hooks stay
// client boundaries in dist/ and can be imported from server components.
const USE_CLIENT =
  /^\s*(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/;
const preserveUseClient = (): Plugin => {
  const clientModules = new Set<string>();
  return {
    name: 'preserve-use-client',
    enforce: 'pre',
    transform(code, id) {
      if (USE_CLIENT.test(code)) clientModules.add(id);
      return null;
    },
    renderChunk(code, chunk) {
      return chunk.facadeModuleId && clientModules.has(chunk.facadeModuleId)
        ? { code: `'use client';\n${code}`, map: null }
        : null;
    },
  };
};

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/features/client',
  plugins: [
    react(),
    preserveUseClient(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: () => [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vite.dev/guide/build.html#library-mode
  build: {
    outDir: '../../dist/features/client',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: {
        index: 'src/index.ts',
        server: 'src/server.ts',
      },
      name: 'client',
      fileName: (format, entryName) => `${entryName}.js`,
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es' as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: isExternal,
      // One output file per module, so 'use client' stays per module
      output: { preserveModules: true, preserveModulesRoot: 'src' },
      onwarn(warning, warn) {
        // directives are re-added by preserveUseClient
        if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning);
      },
    },
  },
}));

import { joinPathFragments, readJson, Tree } from '@nx/devkit';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

const EXTERNAL_ARRAY_PATTERN = /external:\s*\[([^\]]*)\]/;
const EXTRA_EXTERNALS_PATTERN = /const extraExternals: string\[\] = \[([^\]]*)\];/;
const PATH_IMPORT = "import * as path from 'path';";
const DEFINE_CONFIG = 'export default defineConfig(';

const parseEntries = (list: string) =>
  list
    .split(',')
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

const toList = (entries: string[]) => entries.map((entry) => `'${entry}'`).join(', ');

const isCoveredBy = (declared: string[]) => (id: string) =>
  declared.some((name) => id === name || id.startsWith(`${name}/`));

const externalsBlock = (extras: string[]) => `// Everything declared in package.json (dependencies and peerDependencies)
// stays external, including subpath imports (react/jsx-runtime,
// next-auth/providers/github): it is installed alongside the published
// package instead of being bundled into dist/. Packages that must stay
// external without being declared go in extraExternals.
const pkg = JSON.parse(
  readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8')
);
const extraExternals: string[] = [${toList(extras)}];
const externals = [
  ...Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }),
  ...extraExternals,
];
const isExternal = (id: string) =>
  externals.some((name) => id === name || id.startsWith(\`\${name}/\`));
`;

interface PackageJsonDeps {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Rewrites a vite.config.mts so its build externalizes what package.json
 * declares, read at build time. Returns the new content, or null when the
 * config has neither a generated `external: [...]` array nor the
 * `extraExternals` block (left untouched).
 *
 * On first run the `external: [...]` array is replaced; entries it holds that
 * `pkg` doesn't cover move to `extraExternals`. Later runs merge `extras` into
 * `extraExternals`.
 */
export function toDeclaredExternalsConfig(
  content: string,
  pkg: PackageJsonDeps,
  extras: string[] = []
): string | null {
  const existingExtras = content.match(EXTRA_EXTERNALS_PATTERN);
  if (existingExtras) {
    const merged = [...new Set([...parseEntries(existingExtras[1]), ...extras])];
    return content.replace(
      EXTRA_EXTERNALS_PATTERN,
      `const extraExternals: string[] = [${toList(merged)}];`
    );
  }

  const externalArray = content.match(EXTERNAL_ARRAY_PATTERN);
  if (!externalArray || !content.includes(DEFINE_CONFIG)) return null;

  const covered = isCoveredBy(Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }));
  const undeclared = parseEntries(externalArray[1]).filter((entry) => !covered(entry));
  const mergedExtras = [...new Set([...undeclared, ...extras])];

  let next = content.replace(EXTERNAL_ARRAY_PATTERN, 'external: isExternal');
  next = next.includes(PATH_IMPORT)
    ? next.replace(PATH_IMPORT, `${PATH_IMPORT}\nimport { readFileSync } from 'fs';`)
    : `${PATH_IMPORT}\nimport { readFileSync } from 'fs';\n${next}`;
  return next.replace(DEFINE_CONFIG, `${externalsBlock(mergedExtras)}\n${DEFINE_CONFIG}`);
}

/**
 * [externalize-declared-dependencies]
 * Makes a feature library's vite build externalize exactly what its
 * package.json declares (dependencies + peerDependencies, and their subpath
 * imports), evaluated at build time. Declared and external can't drift apart:
 * packages added later (e.g. by `shadcn add`, which installs into the
 * project's own package.json) are externalized without another generator step.
 *
 * Bundling a declared package would ship a second copy, and dual browser/node
 * packages (pino) would get the wrong build baked in.
 *
 * `extras` are kept external without being declared (e.g. pino's
 * `thread-stream` worker).
 */
export function externalizeDeclaredDependencies(
  tree: Tree,
  projectRoot: string,
  extras: string[] = [],
  fileName = 'vite.config.mts'
): void {
  const configPath = joinPathFragments(projectRoot, fileName);
  if (!tree.exists(configPath)) return;

  const packageJsonPath = joinPathFragments(projectRoot, 'package.json');
  const pkg = tree.exists(packageJsonPath) ? readJson(tree, packageJsonPath) : {};
  const next = toDeclaredExternalsConfig(tree.read(configPath, 'utf-8') ?? '', pkg, extras);
  if (next !== null) tree.write(configPath, next);
}

/**
 * On-disk counterpart of externalizeDeclaredDependencies, for executor-time
 * code (e.g. after `shadcn add`). Converts configs still using a static
 * `external: [...]` array (projects generated before this existed); already
 * converted configs are left as they are. Returns whether the file changed.
 */
export function externalizeDeclaredDependenciesOnDisk(
  workspaceRoot: string,
  projectRoot: string,
  fileName = 'vite.config.mts'
): boolean {
  const configPath = path.join(workspaceRoot, projectRoot, fileName);
  const packageJsonPath = path.join(workspaceRoot, projectRoot, 'package.json');
  if (!existsSync(configPath) || !existsSync(packageJsonPath)) return false;

  const content = readFileSync(configPath, 'utf-8');
  if (EXTRA_EXTERNALS_PATTERN.test(content)) return false;

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const next = toDeclaredExternalsConfig(content, pkg);
  if (next === null) return false;

  writeFileSync(configPath, next);
  return true;
}

const USE_CLIENT_PLUGIN_NAME = 'preserve-use-client';
const VITE_IMPORT = "import { defineConfig } from 'vite';";
const REACT_PLUGIN = 'react(),';
const EXTERNAL_OPTION = /external: isExternal,?/;

const useClientBlock = `// Rollup drops module-level directives such as 'use client'. Keep every
// module in its own file (preserveModules) and put the directive back on the
// files whose source starts with it, so client components and hooks stay
// client boundaries in dist/ and can be imported from server components.
const USE_CLIENT = /^\\s*(?:\\/\\/[^\\n]*\\n\\s*|\\/\\*[\\s\\S]*?\\*\\/\\s*)*['"]use client['"]/;
const preserveUseClient = (): Plugin => {
  const clientModules = new Set<string>();
  return {
    name: '${USE_CLIENT_PLUGIN_NAME}',
    enforce: 'pre',
    transform(code, id) {
      if (USE_CLIENT.test(code)) clientModules.add(id);
      return null;
    },
    renderChunk(code, chunk) {
      return chunk.facadeModuleId && clientModules.has(chunk.facadeModuleId)
        ? { code: \`'use client';\\n\${code}\`, map: null }
        : null;
    },
  };
};
`;

const preserveModulesOptions = `external: isExternal,
      // One output file per module, so 'use client' stays per module
      output: { preserveModules: true, preserveModulesRoot: 'src' },
      onwarn(warning, warn) {
        // directives are re-added by preserveUseClient
        if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning);
      },`;

/**
 * Adds the preserveUseClient plugin and preserveModules to a vite.config.mts
 * whose externals were already converted (externalizeDeclaredDependencies).
 * Returns the new content, or null when it's already there or the config
 * doesn't have the expected shape (left untouched).
 */
export function toUseClientBoundariesConfig(content: string): string | null {
  if (content.includes(USE_CLIENT_PLUGIN_NAME)) return null;
  if (
    ![VITE_IMPORT, REACT_PLUGIN, DEFINE_CONFIG].every((part) => content.includes(part)) ||
    !EXTERNAL_OPTION.test(content)
  ) {
    return null;
  }

  return content
    .replace(VITE_IMPORT, "import { defineConfig, type Plugin } from 'vite';")
    .replace(REACT_PLUGIN, `${REACT_PLUGIN}\n    preserveUseClient(),`)
    .replace(EXTERNAL_OPTION, preserveModulesOptions)
    .replace(DEFINE_CONFIG, `${useClientBlock}\n${DEFINE_CONFIG}`);
}

/**
 * [preserve-use-client-boundaries]
 * Makes a feature library's build keep 'use client' on the modules that
 * declare it. Without it, vite bundles each entry into one file and drops the
 * directive, so a client component exported by the library (e.g. logging's
 * GlobalErrorHandler) can't be rendered from a server component.
 */
export function preserveUseClientBoundaries(
  tree: Tree,
  projectRoot: string,
  fileName = 'vite.config.mts'
): void {
  const configPath = joinPathFragments(projectRoot, fileName);
  if (!tree.exists(configPath)) return;

  const next = toUseClientBoundariesConfig(tree.read(configPath, 'utf-8') ?? '');
  if (next !== null) tree.write(configPath, next);
}

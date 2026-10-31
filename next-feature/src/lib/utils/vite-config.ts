import { joinPathFragments, Tree } from '@nx/devkit';

const EXTERNAL_ARRAY_PATTERN = /external:\s*\[([^\]]*)\]/;

/**
 * [add-rollup-external-packages]
 * Vite/Rollup's default resolve conditions favor the `browser` package
 * export condition. Dependencies that ship dual browser/node builds (e.g.
 * pino) get the wrong build baked into the bundle unless they're excluded
 * from bundling entirely. Nx's generated vite.config.mts only externalizes
 * react by default, so any other runtime dependency a feature type adds
 * (pino, pino-http, ...) needs to be appended here.
 *
 * String entries only match that exact module id. Pass a RegExp (written as a
 * regex literal) to also externalize a package's subpath imports, e.g.
 * /^next-auth\// for next-auth/jwt, next-auth/providers/*.
 */
export function addRollupExternalPackages(
  tree: Tree,
  projectRoot: string,
  packages: (string | RegExp)[],
  fileName = 'vite.config.mts'
): void {
  const configPath = joinPathFragments(projectRoot, fileName);
  if (!tree.exists(configPath)) return;

  const content = tree.read(configPath, 'utf-8') ?? '';
  const match = content.match(EXTERNAL_ARRAY_PATTERN);
  if (!match) return;

  // Entries are kept as source text: regex literals verbatim, strings quoted.
  const toSource = (pkg: string | RegExp) =>
    pkg instanceof RegExp ? pkg.toString() : `'${pkg}'`;

  const existing = match[1]
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) =>
      entry.startsWith('/') ? entry : toSource(entry.replace(/^['"]|['"]$/g, ''))
    );

  const merged = [...new Set([...existing, ...packages.map(toSource)])];

  tree.write(
    configPath,
    content.replace(EXTERNAL_ARRAY_PATTERN, `external: [${merged.join(',')}]`)
  );
}

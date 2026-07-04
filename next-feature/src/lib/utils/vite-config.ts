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
 */
export function addRollupExternalPackages(
  tree: Tree,
  projectRoot: string,
  packages: string[],
  fileName = 'vite.config.mts'
): void {
  const configPath = joinPathFragments(projectRoot, fileName);
  if (!tree.exists(configPath)) return;

  const content = tree.read(configPath, 'utf-8') ?? '';
  const match = content.match(EXTERNAL_ARRAY_PATTERN);
  if (!match) return;

  const existing = match[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  const merged = [...new Set([...existing, ...packages])];

  tree.write(
    configPath,
    content.replace(
      EXTERNAL_ARRAY_PATTERN,
      `external: [${merged.map((pkg) => `'${pkg}'`).join(',')}]`
    )
  );
}

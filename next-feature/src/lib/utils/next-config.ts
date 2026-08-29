import { joinPathFragments, Tree } from '@nx/devkit';

const SERVER_EXTERNAL_PATTERN = /serverExternalPackages\s*:\s*\[([^\]]*)\]/;
const NEXT_CONFIG_OBJECT_PATTERN = /(const nextConfig\s*=\s*\{)/;

/**
 * [add-server-external-packages]
 * Marks packages as external in a Next.js app's next.config.js so
 * Turbopack/webpack leave their runtime `require()`s alone instead of
 * bundling them (pino's dynamic requires for transports/workers break
 * otherwise). No-ops if next.config.js doesn't exist or doesn't match the
 * shape @nx/next generates, rather than risk corrupting a hand-edited file.
 */
export function addServerExternalPackages(
  tree: Tree,
  projectRoot: string,
  packages: string[],
  fileName = 'next.config.js'
): void {
  const configPath = joinPathFragments(projectRoot, fileName);
  if (!tree.exists(configPath)) return;

  const content = tree.read(configPath, 'utf-8') ?? '';
  const existingMatch = content.match(SERVER_EXTERNAL_PATTERN);

  if (existingMatch) {
    const existing = existingMatch[1]
      .split(',')
      .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);

    const merged = [...new Set([...existing, ...packages])];

    tree.write(
      configPath,
      content.replace(
        SERVER_EXTERNAL_PATTERN,
        `serverExternalPackages: [${merged.map((pkg) => `'${pkg}'`).join(', ')}]`
      )
    );
    return;
  }

  if (!NEXT_CONFIG_OBJECT_PATTERN.test(content)) return;

  tree.write(
    configPath,
    content.replace(
      NEXT_CONFIG_OBJECT_PATTERN,
      `$1\n  serverExternalPackages: [${packages.map((pkg) => `'${pkg}'`).join(', ')}],`
    )
  );
}

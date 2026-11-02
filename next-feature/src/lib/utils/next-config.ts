import { joinPathFragments, offsetFromRoot, Tree } from '@nx/devkit';

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

/** Build-time switch the Docker generator's Dockerfile sets */
export const STANDALONE_OUTPUT_ENV = 'NEXT_OUTPUT';

/**
 * [enable-standalone-output]
 * Makes `next build` produce a self-contained server (.next/standalone) when
 * NEXT_OUTPUT=standalone, tracing files from the workspace root so feature
 * libraries and root node_modules are included. Other builds (nx serve,
 * Vercel) are unchanged, and `next start` keeps working without the
 * standalone warning. Returns false if next.config.js is missing, already
 * configured, or not in the shape @nx/next generates.
 */
export function enableStandaloneOutput(
  tree: Tree,
  projectRoot: string,
  fileName = 'next.config.js'
): boolean {
  const configPath = joinPathFragments(projectRoot, fileName);
  if (!tree.exists(configPath)) return false;

  const content = tree.read(configPath, 'utf-8') ?? '';
  if (content.includes(STANDALONE_OUTPUT_ENV) || !NEXT_CONFIG_OBJECT_PATTERN.test(content)) return false;

  tree.write(
    configPath,
    content.replace(
      NEXT_CONFIG_OBJECT_PATTERN,
      `$1
  // Container builds (the Dockerfile sets ${STANDALONE_OUTPUT_ENV}=standalone): a
  // self-contained server in .next/standalone, tracing files from the
  // workspace root so feature libraries and root node_modules are included.
  // Other builds (nx serve, Vercel) are unchanged.
  ...(process.env.${STANDALONE_OUTPUT_ENV} === 'standalone' && {
    output: 'standalone',
    outputFileTracingRoot: require('path').join(__dirname, '${offsetFromRoot(projectRoot)}'),
  }),`
    )
  );
  return true;
}

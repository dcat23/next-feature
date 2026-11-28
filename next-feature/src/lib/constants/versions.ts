export const PLUGIN_NAME = require("../../../package.json").name;
export const PLUGIN_VERSION = require("../../../package.json").version;

export const AXIOS_VERSION = "1.9.0"
export const NEXTAUTH_VERSION = "5.0.0-beta.32"
export const ZOD_VERSION = "3.24.4"
export const ZUSTAND_VERSION = "^5.0.6"
export const TANSTACK_VERSION = "5.75.7";
export const SONNER_VERSION = "2.0.3";
export const TAILWIND_VERSION = "^4.1.9";
export const PINO_VERSION = "^10.3.1";
export const PINO_HTTP_VERSION = "^11.0.0";
export const PINO_PRETTY_VERSION = "^13.0.0"
export const NEXT_THEMES_VERSION = "^0.4.0";
export const SERVER_ONLY_VERSION = "^0.0.1";
/** React range published feature libraries declare as a peer dependency */
export const REACT_PEER_VERSION = "^19.0.0";
/**
 * shadcn CLI version run by the shadcn executor and generators (`npx shadcn@<version>`).
 * Pinned exactly: minors change the CLI's behaviour and output (e.g. the `cn` package).
 * Registry content is fetched live regardless; bump deliberately and run the e2e.
 */
export const SHADCN_CLI_VERSION = "4.23.0";
/**
 * nx-ignore (nrwl/nx-labs) version the vercel generator runs in `ignoreCommand`
 * (`npx nx-ignore@<version> <app>`); it installs the workspace's own Nx version.
 */
export const NX_IGNORE_VERSION = "19.8.0";
/**
 * Vercel CLI version the cicd generator's Vercel deploy workflow runs
 * (`npx vercel@<version> pull/build/deploy --prebuilt`). Pinned exactly, like the shadcn CLI.
 */
export const VERCEL_CLI_VERSION = "68.0.0";
/**
 * GitHub Actions the cicd generator's workflows use, by major. Dependabot's
 * github-actions updates (dependencyUpdates=dependabot) keep generated workflows current.
 */
export const GITHUB_ACTIONS = {
  checkout: "actions/checkout@v7",
  setupNode: "actions/setup-node@v7",
  setupPnpm: "pnpm/action-setup@v6",
  setupBun: "oven-sh/setup-bun@v2",
  nxSetShas: "nrwl/nx-set-shas@v5",
  dockerSetupBuildx: "docker/setup-buildx-action@v4",
  dockerLogin: "docker/login-action@v4",
  dockerMetadata: "docker/metadata-action@v6",
  dockerBuildPush: "docker/build-push-action@v7",
} as const;

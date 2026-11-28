# CI/CD Generator

Writes GitHub Actions workflows for the workspace: CI that lints, tests and builds the projects a change affects, opt-in deploy workflows for the [docker](../docker/README.md) and [vercel](../vercel/README.md) deployment targets, and an optional Dependabot configuration. The [preset](../../preset/README.md) runs it (CI only) for new workspaces unless `--ci=false`.

GitHub Actions only for now.

## Usage

```bash
npx nx g next-feature:cicd                                  # .github/workflows/ci.yml
npx nx g next-feature:cicd --docker=web                     # + build and push web's image to ghcr.io
npx nx g next-feature:cicd --vercel=web,admin               # + Vercel CLI deploys for web and admin
npx nx g next-feature:cicd --e2e --dependencyUpdates=dependabot
```

Rerunning it rewrites the generated files (review the diff if you edited them), so add deploy targets by passing the full set of options again.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `docker` | string[] | `[]` | Apps deployed as Docker images to the GitHub Container Registry. Runs `next-feature:docker` for apps without a `Dockerfile` |
| `vercel` | string[] | `[]` | Apps deployed with the Vercel CLI. Runs `next-feature:vercel` for apps without a `vercel.json` |
| `e2e` | boolean | `false` | Add a CI job running the affected projects' `e2e` target |
| `dependencyUpdates` | `none` \| `dependabot` | `none` | `dependabot` writes `.github/dependabot.yml` |
| `skipFormat` | boolean | `false` | Skip formatting |

## What it writes

| File | Contents |
|------|----------|
| `.github/workflows/ci.yml` | `nx affected -t lint test build` on pull requests, pushes to the main branch and manual runs; `e2e` job with `--e2e` |
| `.github/workflows/deploy-<app>-docker.yml` | per `--docker` app |
| `.github/workflows/deploy-<app>-vercel.yml` | per `--vercel` app |
| `.github/dependabot.yml` | with `--dependencyUpdates=dependabot` |
| `.nvmrc` | the current Node major, only when neither `.nvmrc` nor `.node-version` exists |

### CI

- **Toolchain:** the package manager comes from the root `package.json` `packageManager` field, else the lockfile, else Nx's detection (as in the docker and vercel generators). pnpm is set up with `pnpm/action-setup` (which reads `packageManager`, or gets the version found at generation time), yarn with corepack, bun with `oven-sh/setup-bun`. Node comes from `.nvmrc` / `.node-version`, with setup-node's dependency cache (pnpm, npm, yarn). Dependencies install with the frozen lockfile.
- **Affected projects:** [`nrwl/nx-set-shas`](https://github.com/nrwl/nx-set-shas) sets the base to the last successful run on the main branch (pull requests compare against their base), so a failed run's changes are checked again by the next one. The main branch is `nx.json`'s `defaultBase` (default `main`).
- **Nx Cloud:** `NX_NO_CLOUD=true` unless `nx.json` has `nxCloudId` / `nxCloudAccessToken`.
- **Concurrency:** a new push cancels the previous run of a pull request; runs on the main branch always finish, since deployments follow them.
- **e2e:** generated applications have no e2e project (`e2eTestRunner: 'none'`); the job is for projects you add. Playwright projects need a `playwright install --with-deps` step (commented in the workflow).

Creating a workspace with `create-next-feature --nxCloud=github` makes Nx write its own `ci.yml` after the preset, replacing this one.

### Docker deploys

`deploy-<app>-docker.yml` runs when CI completes on the main branch (`workflow_run`), and only for successful runs of pushes: `workflow_run` also fires for pull requests whose branch is named like the main branch, forks included. It checks out the commit CI tested, skips the deployment unless `nx show projects --affected` includes the app since the last successful deployment, then builds the app's `Dockerfile` with Buildx (layer cache in the GitHub Actions cache, scoped per app) and pushes:

```
ghcr.io/<owner>/<repo>/<app>:<commit sha>
ghcr.io/<owner>/<repo>/<app>:latest
```

It logs in with `GITHUB_TOKEN` (`packages: write`), so it needs no secrets. New GHCR packages are private; change the visibility or grant access in the package settings. Running the workflow manually (`workflow_dispatch`) pushes the current commit even when the app isn't affected.

`NEXT_PUBLIC_*` values are inlined at build time: declare them as `ARG`s in the Dockerfile and pass `build-args` to `docker/build-push-action` (commented in the workflow). Server variables are runtime configuration for wherever the image runs.

### Vercel deploys

`deploy-<app>-vercel.yml` builds on the runner with the Vercel CLI (`vercel pull`, `vercel build`, `vercel deploy --prebuilt`, pinned to the version in `VERCEL_CLI_VERSION`) and replaces Vercel's Git integration, so the generator sets `git.deploymentEnabled: false` in the app's `vercel.json`:

- **Production:** after CI passes on the main branch (same `workflow_run` rules and affected check as Docker), or on a manual run.
- **Preview:** for pull requests from this repository, when the pull request affects the app. Forks and Dependabot pull requests are skipped: their runs get no secrets.

The CLI runs at the repository root and builds the project's Root Directory with `vercel.json`'s install and build commands, so the Vercel project is set up as in the [vercel generator](../vercel/README.md#vercel-project-settings) (Root Directory = the app). The job uses GitHub environments named `Production` and `Preview` (created on first use), and writes the deployment URL to the job summary.

Repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | an access token from vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `orgId` in `.vercel/project.json` after `npx vercel link` |
| `VERCEL_<APP>_PROJECT_ID` | `projectId` of that app's Vercel project, e.g. `VERCEL_WEB_PROJECT_ID` |

The app's environment variables stay in the Vercel project settings (see the vercel generator); `vercel pull` fetches them for the build.

### Dependabot

Weekly updates for the workspace's packages (`npm` ecosystem, which covers pnpm and yarn; `bun` for bun workspaces), minor and patch updates grouped into one pull request, and for the GitHub Actions in the workflows. Nx packages are ignored: update them with `nx migrate latest`, which also migrates the workspace's code and configuration.

## Before the first run

- CI runs `nx lint`: until [#80](https://github.com/dcat23/next-feature/issues/80) is fixed, freshly generated applications fail it (own-alias imports, `next-env.d.ts`).
- The first run of a deploy workflow has no previous successful deployment, so nx-set-shas compares against the previous commit.
- Deploy workflows triggered by `workflow_run` only run from the default branch: merge them before expecting deployments.

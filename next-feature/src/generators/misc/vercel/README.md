# Vercel Generator

Writes `vercel.json` for deploying a Next.js application from this Nx workspace to Vercel, so the project needs only one dashboard setting (Root Directory) and skips deployments of commits that don't affect the app.

## Usage

```bash
npx nx g next-feature:vercel web
npx nx g next-feature:vercel web --ignoreUnaffected=false   # deploy every commit
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectName` (`-p`, positional) | string | required | Application to deploy (must have a `next.config.*`) |
| `ignoreUnaffected` | boolean | `true` | Add an `ignoreCommand` that skips the deployment when the commit doesn't affect the app |
| `skipFormat` | boolean | `false` | Skip formatting |

## What it changes

`apps/web/vercel.json` (other keys in an existing file, such as `crons` or `headers`, are kept):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "cd ../.. && npx -y pnpm@11.9.0 install --frozen-lockfile",
  "buildCommand": "cd ../.. && npx nx build web",
  "outputDirectory": "../../dist/apps/web/.next",
  "ignoreCommand": "cd ../.. && pnpm_config_strict_dep_builds=false npx -y nx-ignore@19.8.0 web"
}
```

| Key | Why |
|-----|-----|
| `installCommand` | Vercel runs commands in the Root Directory (the app); the install runs at the workspace root with its lockfile. The package manager comes from the root `package.json` `packageManager` field, else the lockfile, else Nx's detection (same as the [docker generator](../docker/README.md)). pnpm runs at the version found at generation time: Vercel otherwise picks pnpm by lockfile version, which may not be the major that wrote it |
| `buildCommand` | `nx build <app>`, the same build as locally (`withNx`, Nx's `outputPath`) |
| `outputDirectory` | `@nx/next:build` writes `.next` to its `outputPath` (`dist/apps/<app>`), not the app directory. Without it the build fails with `NEXT_OUTPUT_DIR_MISSING`. Apps built by inferred targets use `.next` |
| `ignoreCommand` | Vercel's Ignored Build Step (exit 0 skips). [`nx-ignore`](https://github.com/nrwl/nx-labs/tree/main/packages/nx-ignore) installs Nx on its own (the step runs before the install) and checks whether the app is affected since the last deployment (`VERCEL_GIT_PREVIOUS_SHA`), including changes to the feature libraries it imports. `pnpm_config_strict_dep_builds=false` lets that install succeed under pnpm 11's build-script approval |

It also adds `.vercel` (written by `vercel link` and `vercel build`) to `.gitignore`.

## Vercel project settings

1. **Import the repository** as a new project (one Vercel project per app).
2. **Root Directory:** the app, e.g. `apps/web`. Keep **Include files outside the root directory in the Build Step** enabled (the default): the app imports feature libraries from `features/`.
3. **Framework, install, build and output settings:** leave them at their defaults; `vercel.json` overrides them.
4. **Environment variables:** see below.

Commit messages can override the ignore step: `[nx deploy]` / `[nx deploy web]` forces a deployment, `[nx skip web]` skips one.

## Environment variables

`.env` files are gitignored, so nothing in them reaches Vercel. The generator lists the variables to add:

- **Required:** keys in the app's `.env` (e.g. `<APP>_API_URL` from `client-config`, `AUTH_SECRET` and provider credentials with `--useAuth`). Set them for **Production** and **Preview** (and **Development** for `vercel dev`). Preview deployments usually point `<APP>_API_URL` at a staging backend.
- **Optional:** keys only in `.env.example`, overrides whose defaults live in code (e.g. `LOGGING_SERVICE_NAME`).
- **Auth.js:** don't add `NEXTAUTH_URL`, `AUTH_URL` or `AUTH_TRUST_HOST`. On Vercel, Auth.js trusts the host and takes the URL from the request, which is what makes preview deployments work. The `NEXTAUTH_URL=http://localhost:4200` in `.env` is for local development only. Generate a separate `AUTH_SECRET` per environment (`npx auth secret`).
- **`NEXT_PUBLIC_*`** values are inlined at build time: changing one needs a redeploy.

## Verify locally

```bash
npx vercel link            # once: connects the directory to the Vercel project (pulls its settings into .vercel/)
npx vercel pull            # environment variables and settings
npx vercel build           # runs installCommand and buildCommand, writes .vercel/output
npx vercel deploy --prebuilt
```

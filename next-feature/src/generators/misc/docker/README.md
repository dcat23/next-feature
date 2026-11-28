# Docker Generator

Containerizes a Next.js application: a multi-stage `Dockerfile` that builds the app with Nx and runs Next's standalone server as a non-root user, a workspace `.dockerignore`, and the app's service in the workspace root `compose.yaml`.

For choosing between Docker and Vercel, and the variables each environment needs, see the [production deployment guide](../../../../DEPLOYMENT.md).

## Usage

```bash
npx nx g next-feature:docker web
npx nx g next-feature:docker admin --port=3001      # a second app on another host port
npx nx g next-feature:docker web --compose=false    # Dockerfile only

docker compose up --build            # every app in compose.yaml
npx nx run web:docker-run            # docker compose up --build web
npx nx run web:docker-build          # docker build -f apps/web/Dockerfile -t web .
# with --compose=false, docker-run is: docker run --rm -p 3000:3000 --env-file apps/web/.env web
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectName` (`-p`, positional) | string | required | Application to containerize (must have a `next.config.*`) |
| `port` | number | `3000` | Host port the compose service publishes; the container always listens on 3000 |
| `compose` | boolean | `true` | Add the service to the workspace root `compose.yaml` |
| `skipFormat` | boolean | `false` | Skip formatting |

## What it changes

| File | Change |
|------|--------|
| `<app>/next.config.js` | `output: 'standalone'` and `outputFileTracingRoot` (the workspace root), **only when `NEXT_OUTPUT=standalone`**, which the Dockerfile sets. `nx serve`, `nx build`, `next start` and Vercel builds are unchanged |
| `<app>/Dockerfile` | Builder stage: package manager setup, frozen install, `nx build <app>`. Runner stage: `node:<version>-alpine` with only the standalone server, `.next/static` and `public/`, `USER node`, `HEALTHCHECK` |
| `.dockerignore` (root) | Merged: `**/.env`, `**/.env.*` (keeps `.env.example`), `**/node_modules`, `dist`, `.nx`, `**/.next`, `tmp`, `.git` |
| `compose.yaml` (root) | The app's service (created if missing; an existing service with the same name is left unchanged) |
| `<app>/project.json` | `docker-build` and `docker-run` targets |

The build context is the **workspace root**: the app imports feature libraries from outside its own directory, and the install needs the root lockfile.

### Package manager

Detected from the root `package.json` `packageManager` field, else the lockfile (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock`), else Nx's `detectPackageManager()`. The Dockerfile uses its frozen install (`pnpm install --frozen-lockfile`, `npm ci`, `yarn install --immutable`, `bun install --frozen-lockfile`) and pins the version found at generation time (`corepack prepare pnpm@<version>`), so the image doesn't install a newer major than the one that wrote the lockfile. Add a `packageManager` field to `package.json` to control it.

pnpm 11 refuses dependency build scripts that `pnpm-workspace.yaml` doesn't approve (`allowBuilds`); the image uses the same file, so run `pnpm approve-builds` once in the workspace.

### Node version

The major from `.nvmrc` or `.node-version`, else the Node version running the generator (`ARG NODE_VERSION` in the Dockerfile).

## Publishing images

`npx nx g next-feature:cicd --docker=web` adds a GitHub Actions workflow that builds this Dockerfile and pushes the image to ghcr.io after CI passes, when the app is affected (see the [cicd generator](../cicd/README.md)).

## Environment variables

- **Server variables** are read at runtime. The compose service loads the app's `.env` (`env_file`, optional) and sets `PORT`; apps with `--useAuth` also get `NEXTAUTH_URL` (the published URL) and `AUTH_TRUST_HOST`. `.env` files never enter the image (`.dockerignore`). The server [validates its variables at startup](../../project/application/README.md#validation-at-startup) and exits when a required one is missing, so a container run without them stops right away.
- **`localhost` inside the container is the container itself.** A backend on your machine is `http://host.docker.internal:<port>` (the service maps it to the host gateway, also on Linux); another compose service is `http://<service>:<port>`. Override the app's URL variables in the service's `environment`.
- **`NEXT_PUBLIC_*`** values are inlined at build time: declare them as build args in the Dockerfile (`ARG` + `ENV`) and pass them with `build.args` in compose.

## Health check

The image's `HEALTHCHECK` calls the app's liveness route, `/api/health` (generated with every application; apps created before it fall back to `/`). Readiness (`/api/ready`) is for orchestrators and load balancers, not the container's health: a backend outage shouldn't restart the container.

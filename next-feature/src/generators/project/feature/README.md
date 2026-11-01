# Feature Library Generator

The Feature generator creates a Next.js feature library in your monorepo with TypeScript configuration and type-specific file scaffolding.

## Overview

Feature libraries are domain-scoped code modules (users, products, auth) created under `features/[name]/`. The generator supports these types:

- **`generic`** (default) — Plain feature library with shared utilities only
- **`logging`** — Adds pino-based server + browser logging with correlation ID support
- **`client`** — Adds a reusable API client (Axios wrapper, `ApiError`, hooks, error boundary)
- **`auth`** — Adds a NextAuth.js configuration with credential + OAuth providers, token refresh and a server-only `getAccessToken()`
- **`ui`** — Adds a shadcn-ready component library (`components.json`, `cn()` util, Tailwind entry) plus a `shadcn` target for pulling in components

Type is inferred automatically from the feature name: `--name=logging` sets `type=logging`, `--name=client` sets `type=client`, `--name=auth` sets `type=auth`, `--name=ui` sets `type=ui`.

## Quick Start

```bash
# Create a generic feature library
npx nx g next-feature:feature --name=users

# Create a logging library (explicit type)
npx nx g next-feature:feature --name=logger --type=logging

# Create a logging library (inferred from name)
npx nx g next-feature:feature --name=logging

# Create an API client library (explicit type)
npx nx g next-feature:feature --name=apiClient --type=client

# Create a shadcn-ready ui component library (explicit type)
npx nx g next-feature:feature --name=ui --type=ui

# Custom directory
npx nx g next-feature:feature --name=users --directory=libs/users
```

## Generator Options

| Option | Type | Default | Alias | Description |
|--------|------|---------|-------|-------------|
| `--name` | string | required | positional | Name of the feature library |
| `--type` | `logging \| client \| auth \| ui \| generic` | `generic` | `-t` | Type of feature library to scaffold |
| `--directory` | string | `features/[name]` | `-d` | Override the output directory |
| `--orgName` | string | — | `--org` | Organization prefix for import paths (`@myorg/[name]`) |
| `--skipFormat` | boolean | false | — | Skip prettier formatting (used internally for chained generators) |

### `type` Option

Controls which additional files are scaffolded beyond the base `src/` structure.

#### Auto-inference

The `type` is inferred from `name` when `type` is `generic` or omitted:

| Name | Inferred type |
|------|--------------|
| `logging` | `logging` |
| `client` | `client` |
| `auth` | `auth` |
| `ui` | `ui` |
| anything else | `generic` |

An explicit `--type` always takes precedence over inference.

## What Gets Created

### All types — base `src/` files

These files are always generated regardless of type:

```
features/[name]/src/
├── lib/
│   └── config/
│       └── env.ts          # Typed process.env accessors (zod schema; see below)
├── index.ts                # Public browser exports
└── server.ts               # Public server-side exports
```

`env.ts` starts with just `NODE_ENV` typed. API URL vars are added by the [client-config generator](../../misc/client-config/README.md) (`<NAME>_API_URL`, also run by the first action). `--type=client` adds `<NAME>_API_URL` as an optional var (`z.string().optional()`, `.env.example` only): it's only `ApiClient`'s fallback `baseURL`, since each project's `lib/config/client.ts` passes its own (see the [client-config generator](../../misc/client-config/README.md)). It's kept up to date by the [dotenv generator](../../misc/dotenv/README.md)'s marker-based sync, so you can add/remove further vars later with `npx nx g next-feature:dotenv --projectName=[name] --set=KEY=VALUE` without disturbing what's already there.

### `logging` type — additional files

```
features/[name]/src/
├── config.ts               # createPinoOptions() / pinoOptions (server-only)
├── lib/
│   ├── server.ts           # Server-side pino logger (Node.js; server-only)
│   ├── client.ts           # Browser pino logger ('use client', transmit config)
│   ├── constants.ts        # DEFAULT_LOGGING_BEACON_PATH ('/api/log')
│   ├── correlation.ts      # getCorrelationId / setCorrelationId (sessionStorage)
│   └── utils/index.ts      # registerPino(options?) for instrumentation.ts (server-only)
├── index.ts                # Client-safe: browser logger, GlobalErrorHandler, constants, correlation utilities
└── server.ts               # 'server-only': server logger, createPinoOptions, pinoOptions, registerPino
```

**Additional dependencies added:**

```json
{
  "dependencies": { "pino": "^9.x.x" },
  "devDependencies": { "pino-pretty": "^13.x.x" }
}
```

**Browser logger** (`lib/client.ts`) uses pino's browser transport with correlation ID injection. Marked `'use client'` for Next.js.

**`GlobalErrorHandler`** (`'use client'`) logs `window` errors and unhandled rejections through the browser logger. It can be rendered straight from a server component, e.g. the root layout (the application generator does this):

```tsx
import { GlobalErrorHandler } from '@feature/logging';

<body>
  <GlobalErrorHandler />
  {children}
</body>
```

**Server logger** (`lib/server.ts`) uses pino with pino-pretty in development (`NODE_ENV !== 'production'`).

**Configuration** follows "defaults in code, env vars as overrides". Neither var is required: both are typed `z.string().optional()` in `lib/config/env.ts` and only documented in `.env.example`.

| Variable | Used by | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_LOGGING_BEACON_PATH` | browser logger (`lib/client.ts`), inlined by Next.js at build time | `DEFAULT_LOGGING_BEACON_PATH` (`/api/log`), the route the [application generator](../application/README.md#logging) creates |
| `LOGGING_SERVICE_NAME` | `createPinoOptions()` (server), read at runtime | the `service` passed in code; omitted from log lines if neither is set |

```typescript
import { createPinoOptions, registerPino } from '@feature/logging/server';

// The app's name goes in code; LOGGING_SERVICE_NAME overrides it per deployment
const pinoOptions = createPinoOptions({ service: 'web', level: 'debug' });
await registerPino(pinoOptions); // defaults to pinoOptions (env-only service) when omitted
```

### `'use client'` in the build

A feature's `vite.config.mts` builds with `preserveModules` (one output file per source module) and a small `preserveUseClient` plugin that puts `'use client'` back on the files whose source starts with it; Rollup would otherwise drop the directive. Client components and hooks exported from `index.ts` (`GlobalErrorHandler`, `ApiErrorBoundary`, `useApiError`, ...) therefore stay client boundaries in the published package and can be imported from server components.

### `client` type — additional files

```
features/[name]/src/
├── components/
│   └── api-error-boundary.tsx  # React error boundary for ApiError
├── hooks/
│   └── use-api-error.tsx       # useApiError() hook
├── lib/
│   ├── client.ts                # ApiClient (Axios wrapper: retries, token refresh; server-only)
│   ├── error.ts                 # ApiError class + ApiErrorBuilder
│   ├── actions/
│   │   └── with-api.ts          # withApi / withForm server action wrappers (server-only)
│   ├── types/
│   │   ├── index.ts             # ApiResponse, ProblemDetail
│   │   └── client.ts            # ApiClientConfig
│   └── utils/
│       ├── axios.ts             # Axios error -> ProblemDetail extraction
│       ├── zod.ts                # Zod error -> ApiError conversion (FORM_ERROR_KEY)
│       └── error.ts              # getErrorMessage, isHttpStatus, handleApiError
├── index.ts                     # Client-safe: ApiError, ApiErrorBuilder, types, error utils, ApiErrorBoundary, useApiError
└── server.ts                    # 'server-only': ApiClient, withApi / withForm
```

**Additional dependencies added:**

```json
{
  "dependencies": { "axios": "^1.x.x" }
}
```

**`ApiClient` options.** All optional; `lib/config/client.ts` (the [client-config generator](../../misc/client-config/README.md)) passes `baseURL` and `userAgent`.

| Option | Default | Description |
|--------|---------|-------------|
| `baseURL` | `<NAME>_API_URL` (optional env var) | API base URL |
| `timeout` | `30000` | Request timeout (ms) |
| `userAgent` | - | `User-Agent` header, e.g. `orders/1.2.0` |
| `headers` | - | Default headers for every request |
| `maxRetries` | `1` | Retries on network errors, 5xx (except 501) and 429 |
| `retryDelay` | `1000` | Base delay (ms) for exponential backoff. A `Retry-After` header is honoured, unless it's longer than `timeout` |
| `retryMethods` | `get`, `head`, `options`, `put`, `delete` | Methods that are retried. POST/PATCH aren't by default: retrying them can repeat side effects |
| `logger` | console | `{ info, warn, error }(obj, msg)`, e.g. a pino logger. Used for retries and hook errors |
| `onAuthenticated` | - | Runs before each request (e.g. attach a token). If it throws, the error is logged and the request is still sent |
| `enableRefreshToken` | `false` | On a 401, call `onRefreshToken` and retry once with `Bearer <token>` |
| `onRefreshToken` | - | Returns the new token. Throwing or returning an empty token fails the refresh |
| `onUnauthorized` / `onRefreshTokenExpired` | - | Called when the refresh fails / when the refreshed token is rejected too |
| `skipRefreshPaths` | `[]` | URL patterns (e.g. login) that never trigger a refresh |

Clients in `lib/config/client.ts` are module-level, so one instance serves every request the server handles. Token refreshes are keyed by the request's expired `Authorization` header: concurrent requests with the same token share one refresh, and requests from other users are never retried with it.

**Validation errors.** `ApiError.of(zodError)` (and `withApi`, when an action throws a `ZodError`) returns a 400 whose `problemDetail.errors` is keyed by each issue's dotted path (`email`, `address.city`, `tags.0`). Issues without a path, such as an object-level `.refine()`, go under `FORM_ERROR_KEY` (`'_form'`):

```typescript
import { ApiError, FORM_ERROR_KEY } from '@feature/apiClient';

const errors = ApiError.of(response.error).problemDetail.errors ?? {};
errors['address.city']; // field error
errors[FORM_ERROR_KEY]; // e.g. "Passwords must match"
```

Published package exports are rewritten so `.` and `./server` resolve without a `./dist/` prefix (see [`updatePackageJsonExports`](./utils/index.ts)), matching how the package root looks once built.

### `auth` type — additional files

A NextAuth.js (v5) setup for a Credentials provider backed by your own API, plus zero-config OAuth providers. The backend's tokens live in the encrypted session cookie and never reach the browser.

```
src/
├── lib/auth/
│   ├── index.ts           # NextAuth instance and providers; authorize() validates credentials and calls login()
│   ├── auth.config.ts     # Shared options (pages, callbacks, session); providers are added in index.ts
│   ├── callbacks.ts       # signIn (OAuth exchange), jwt, session, redirect, authorized
│   ├── backend.ts         # credentialsSchema (BackendCredentials via z.infer), login() / exchangeOAuth() / refresh() stubs
│   ├── tokens.ts          # Access token expiry check and deduplicated refresh
│   └── access-token.ts    # 'server-only' getAccessToken()
├── lib/types/next-auth.d.ts  # Session / User / JWT augmentation
├── index.ts               # Client-safe: types only
└── server.ts              # 'server-only': auth, handlers, signIn, signOut, getAccessToken
```

**Flow.**

| Step | Where | What |
|------|-------|------|
| Sign-in | `authorize()` | Validates the credentials with zod, calls `login()` with the client IP (for rate limiting) and returns the user with `accessToken`, `refreshToken`, `accessTokenExpires`. Rejected sign-ins return `null` without saying why |
| OAuth sign-in | `signIn` callback | Calls `exchangeOAuth()` with the provider, its account id and the provider's `id_token`/`access_token`, and gives the user the backend's id, role and tokens. A `null` result or an error refuses the sign-in (`?error=AccessDenied`) |
| Every session read | `jwt` callback | Copies the tokens into the JWT on sign-in. Afterwards returns the token while the access token is valid (30s skew), otherwise refreshes it. A failed refresh clears the tokens and sets `error: 'RefreshTokenError'` |
| Browser | `session` callback | Exposes `user.id`, `user.role` (and `error`) only. Never the tokens |
| Proxy | `authorized` | `!!auth?.user && !auth.error`, when the proxy uses the default handler |
| Server code | `getAccessToken()` | Reads the access token from the session cookie, refreshing it if expired |

**Implementing `backend.ts`.** The stubs' examples call your API through an `ApiClient` in the feature's own `lib/config/client.ts` (`npx nx g next-feature:client-config -p auth`, base URL `AUTH_API_URL`). `login()` returns `null` when the client throws a 401 (`ApiError.of(error).isUnauthorized`); `refresh()` lets the client's `ApiError` propagate, which signs the user out. Don't add `getAccessToken()` to that client: these calls are how the tokens are obtained.

**Calling your API as the user.** Attach the token in `lib/config/client.ts` ([client-config](../../misc/client-config/README.md)):

```typescript
import { getAccessToken } from '@feature/auth/server';

export const api = new ApiClient({
  baseURL: WEB_API_URL,
  onAuthenticated: async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  },
});
```

The `jwt` callback already refreshes tokens, so `ApiClient`'s `enableRefreshToken`/`onRefreshToken` aren't needed with NextAuth.

**Refreshes are deduplicated.** The same refresh token can reach the server more than once: concurrent requests, `auth()` in server components (which can't save a refreshed cookie), and server components rendered in the same request as a proxy refresh (they still see the old cookie). `tokens.ts` keeps each refresh, in flight and then until its access token expires, keyed by the refresh token it used, so the backend sees each refresh token once. That matters when it rotates refresh tokens and revokes sessions on reuse. The cache is per server instance: with several instances, give the backend a short reuse grace period too.

**Don't call `getAccessToken()` from `backend.ts`.** `login()` and `refresh()` obtain the tokens, so the session cookie doesn't hold them yet. Calling `getAccessToken()` there, directly or through a client's `onAuthenticated`, would deadlock on its own refresh, or return the previous user's token when someone signs in while signed in as another user. `authorize()` and the refresh run these calls inside an `AsyncLocalStorage` scope (`runAuthFlow()`, `tokens.ts`), and `getAccessToken()` throws inside it (`ApiClient` logs the error and sends the request without the token). Calls to other services during sign-in use the token `login()` received.

The library build keeps `next` (`next/headers`) and `node:async_hooks` external.

**Hardening notes.**
- `useSession().update(data)` sends client-controlled data to the `jwt` callback (`trigger: 'update'`). Whitelist fields there; never copy the role or tokens from it.
- Cookies keep the Auth.js defaults (`__Host-`/`__Secure-` prefixes, `secure` over https). Outside Vercel set `AUTH_URL` and `AUTH_TRUST_HOST=true`.
- Keep `session.maxAge` at most the backend's refresh token lifetime.
- OAuth sign-ins are refused until `exchangeOAuth()` is implemented (it logs a warning). The backend should verify the provider credential itself (the `id_token` for OIDC providers like Google; the `access_token` against the provider's API for GitHub), never the profile alone, and link accounts by an existing provider link or a verified email only. Linking on an unverified email is an account-takeover path. The `jwt` callback also refuses a provider sign-in that arrives without backend tokens.
- The providers read `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` and `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` (listed in the app's `.env.example` with `--useAuth`). Remove the providers you don't use from `lib/auth/index.ts`.

### `ui` type — additional files

```
features/[name]/
├── components.json              # shadcn config (aliases point at this feature's importPath)
└── src/
    └── styles/
        └── globals.css          # Tailwind v4 entry (@import "tailwindcss")
```

Unlike the other types, `components.json` is generated at the **project root**, not under `src/` — the shadcn CLI expects it next to `package.json`.

No component dependencies are added up front: `shadcn init` writes the `cn()` helper and installs `clsx`/`tailwind-merge`, and `shadcn add` installs whatever each component needs (e.g. `class-variance-authority`, `lucide-react`). They're installed into this project's own `package.json`, and every feature's `vite.config.mts` externalizes whatever its `package.json` declares, so they're published as dependencies instead of being bundled into `dist/`. The `shadcn` target also mirrors them into the workspace root and, for projects generated before 0.2.0, converts the old static `external: [...]` list.

A `shadcn` target is also registered on the project so components can be pulled in later:

```bash
npx nx run ui:shadcn --args="add button"
npx nx run ui:shadcn --args="add button card dialog"
```

This runs `npx shadcn@latest <args>` in the project's root, where `components.json` resolves the `utils`/`ui`/`hooks` aliases to this feature's own `src/`. No components are pre-generated — this type only scaffolds the plumbing.

### `generic` type

No additional files beyond the base `src/` structure.

## Directory Structure (full example — logging type)

```
features/[name]/
├── src/
│   ├── lib/
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── server.ts           # pino server logger
│   │   ├── client.ts           # pino browser logger
│   │   └── correlation.ts      # correlation ID helpers
│   ├── config.ts               # pinoOptions
│   ├── index.ts                # browser exports
│   └── server.ts               # server exports
├── .eslintrc.json
├── jest.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── project.json
```

## TypeScript Path Aliases

After creating a feature, `tsconfig.base.json` gets a wildcard path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@feature/[name]/*": ["features/[name]/src/*"]
    }
  }
}
```

With `--orgName=myorg`: `@myorg/[name]/*`.

Usage:

```typescript
// Browser
import { logger } from '@feature/logging';
import { getCorrelationId } from '@feature/logging';

// Server (server components, actions, route handlers, instrumentation)
import { logger, createPinoOptions, pinoOptions, registerPino } from '@feature/logging/server';
```

## Default Dependencies

All feature types include:

| Package | Purpose |
|---------|---------|
| `sonner` | Toast notifications |
| `zod` | Schema validation |

## Common Workflows

### Create a logging library

```bash
# Name infers type automatically
npx nx g next-feature:feature --name=logging

# Import in your app
# Browser: import { logger } from '@feature/logging'
# Server:  import { logger } from '@feature/logging/server'
```

### Create an API client library

```bash
npx nx g next-feature:feature --name=apiClient --type=client

# Import in your app
import { ApiError, getErrorMessage } from '@feature/apiClient';  // client-safe
import { ApiClient, withApi } from '@feature/apiClient/server';  // server-only
```

### Create a users feature with API actions

```bash
# 1. Create feature
npx nx g next-feature:feature --name=users

# 2. Create API action
npx nx g next-feature:action --name=getUsers --actionType=api --projectName=users

# 3. Create component
npx nx g next-feature:component --name=UserList --projectName=users

# 4. Create store
npx nx g next-feature:store --name=userStore --projectName=users
```

## Development Commands

```bash
# Build feature library
npx nx build [name]

# Run tests
npx nx test [name]

# Lint code
npx nx lint [name]

# Run all project tests (includes required env flag)
pnpm test
```

> **Note:** Tests that invoke `@nx/next`'s `libraryGenerator` require `NODE_OPTIONS=--experimental-vm-modules` due to a dynamic ESM import in newer prettier versions. Running `pnpm test` sets this automatically. For direct `nx test` calls: `NODE_OPTIONS=--experimental-vm-modules npx nx test next-feature`.

## Generating Code Inside Features

```bash
# Server action
npx nx g next-feature:action --name=getUser --actionType=api --projectName=[name]

# React component
npx nx g next-feature:component --name=UserCard --projectName=[name]

# Zustand store
npx nx g next-feature:store --name=userStore --projectName=[name]

# TypeScript types
npx nx g next-feature:data-type --name=User --projectName=[name]

# Constants
npx nx g next-feature:constant --name=userRoles --projectName=[name]
```

## Troubleshooting

### TypeScript path aliases not resolving

Check `tsconfig.base.json`:

```bash
cat tsconfig.base.json | grep -A 5 '"paths"'
```

If missing, re-run the generator or add the paths manually.

### Imports failing after feature creation

Clear the Nx cache:

```bash
npx nx reset
```

### Tests failing with "dynamic import callback" error

Run tests with the required Node.js flag:

```bash
NODE_OPTIONS=--experimental-vm-modules npx nx test next-feature
# or via the workspace script:
pnpm test
```

### pino not found at runtime

Ensure dependencies are installed after generator runs:

```bash
pnpm install
```

## See Also

- [Action Generator](../../code/action/README.md) - Server actions (API, form, database)
- [Component Generator](../../code/component/README.md) - React components
- [Store Generator](../../code/store/README.md) - Zustand stores
- [Dotenv Generator](../../misc/dotenv/README.md) - Manage .env* vars and env.ts
- [Preset Generator](../preset/README.md) - Initialize first application
- [next-feature Plugin](../../README.md) - All generators

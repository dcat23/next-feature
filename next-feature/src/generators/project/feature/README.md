# Feature Library Generator

The Feature generator creates a Next.js feature library in your monorepo with TypeScript configuration and type-specific file scaffolding.

## Overview

Feature libraries are domain-scoped code modules (users, products, auth) created under `features/[name]/`. The generator supports four types:

- **`generic`** (default) — Plain feature library with shared utilities only
- **`logging`** — Adds pino-based server + browser logging with correlation ID support
- **`base`** — Adds base UI components (error boundary, etc.)
- **`client`** — Adds a reusable API client (Axios wrapper, `ApiError`, hooks, error boundary)

Type is inferred automatically from the feature name: `--name=logging` sets `type=logging`, `--name=base` sets `type=base`, `--name=client` sets `type=client`.

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

# Custom directory
npx nx g next-feature:feature --name=users --directory=libs/users
```

## Generator Options

| Option | Type | Default | Alias | Description |
|--------|------|---------|-------|-------------|
| `--name` | string | required | positional | Name of the feature library |
| `--type` | `base \| logging \| client \| generic` | `generic` | `-t` | Type of feature library to scaffold |
| `--directory` | string | `features/[name]` | `-d` | Override the output directory |
| `--orgName` | string | — | `--org` | Organization prefix for import paths (`@myorg/[name]`) |
| `--env` | boolean | `false` | `-e` | Add the axios dependency and register a `<NAME>_API_URL` variable in this feature's `.env`/`.env.example` |
| `--skipFormat` | boolean | false | — | Skip prettier formatting (used internally for chained generators) |

### `type` Option

Controls which additional files are scaffolded beyond the base `src/` structure.

#### Auto-inference

The `type` is inferred from `name` when `type` is `generic` or omitted:

| Name | Inferred type |
|------|--------------|
| `base` | `base` |
| `logging` | `logging` |
| `client` | `client` |
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

`env.ts` starts with just `NODE_ENV` typed. When `--env` is set (or `--type=client`), a `<NAME>_API_URL` var is added to it (and to `.env`/`.env.example`). It's kept up to date by the [dotenv generator](../../misc/dotenv/README.md)'s marker-based sync, so you can add/remove further vars later with `npx nx g next-feature:dotenv --projectName=[name] --set=KEY=VALUE` without disturbing what's already there.

### `logging` type — additional files

```
features/[name]/src/
├── config.ts               # Shared pino options (pinoOptions export)
├── lib/
│   ├── server.ts           # Server-side pino logger (Node.js)
│   ├── client.ts           # Browser pino logger ('use client', transmit config)
│   └── correlation.ts      # getCorrelationId / setCorrelationId (sessionStorage)
├── index.ts                # Exports browser logger + correlation utilities
└── server.ts               # Exports server logger
```

**Additional dependencies added:**

```json
{
  "dependencies": { "pino": "^9.x.x" },
  "devDependencies": { "pino-pretty": "^13.x.x" }
}
```

**Browser logger** (`lib/client.ts`) uses pino's browser transport with correlation ID injection. Marked `'use client'` for Next.js.

**Server logger** (`lib/server.ts`) uses pino with pino-pretty in development (`NODE_ENV !== 'production'`).

### `base` type — additional files

```
features/[name]/src/
└── components/
    └── error-component.tsx  # Base error boundary component
```

No pino dependencies are added for the `base` type.

### `client` type — additional files

```
features/[name]/src/
├── components/
│   └── api-error-boundary.tsx  # React error boundary for ApiError
├── hooks/
│   └── use-api-error.tsx       # useApiError() hook
├── lib/
│   ├── client.ts                # ApiClient (Axios wrapper: retries, token refresh)
│   ├── error.ts                 # ApiError class + ApiErrorBuilder
│   ├── actions/
│   │   └── with-api.ts          # withApi / withForm server action wrappers
│   ├── types/
│   │   ├── index.ts             # ApiResponse, ProblemDetail
│   │   └── client.ts            # ApiClientConfig
│   └── utils/
│       ├── axios.ts             # Axios error -> ProblemDetail extraction
│       ├── zod.ts                # Zod error -> ApiError conversion
│       └── error.ts              # getErrorMessage, isHttpStatus, handleApiError
├── index.ts                     # Exports ApiClient, ApiError, hooks, components
└── server.ts                    # Exports withApi / withForm
```

**Additional dependencies added:**

```json
{
  "dependencies": { "axios": "^1.x.x" }
}
```

Published package exports are rewritten so `.` and `./server` resolve without a `./dist/` prefix (see [`updatePackageJsonExports`](./utils/index.ts)), matching how the package root looks once built.

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

// Server (Next.js server components / actions)
import { logger } from '@feature/logging/server';
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
import { ApiClient, ApiError, useApiError } from '@feature/apiClient';
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

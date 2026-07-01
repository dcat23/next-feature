# Feature Library Generator

The Feature generator creates a Next.js feature library in your monorepo with TypeScript configuration and type-specific file scaffolding.

## Overview

Feature libraries are domain-scoped code modules (users, products, auth) created under `features/[name]/`. The generator supports three types:

- **`generic`** (default) — Plain feature library with shared utilities only
- **`logging`** — Adds pino-based server + browser logging with correlation ID support
- **`base`** — Adds base UI components (error boundary, etc.)

Type is inferred automatically from the feature name: `--name=logging` sets `type=logging`, `--name=base` sets `type=base`.

## Quick Start

```bash
# Create a generic feature library
npx nx g next-feature:feature --name=users

# Create a logging library (explicit type)
npx nx g next-feature:feature --name=logger --type=logging

# Create a logging library (inferred from name)
npx nx g next-feature:feature --name=logging

# Custom directory
npx nx g next-feature:feature --name=users --directory=libs/users
```

## Generator Options

| Option | Type | Default | Alias | Description |
|--------|------|---------|-------|-------------|
| `--name` | string | required | positional | Name of the feature library |
| `--type` | `base \| logging \| generic` | `generic` | `-t` | Type of feature library to scaffold |
| `--directory` | string | `features/[name]` | `-d` | Override the output directory |
| `--orgName` | string | — | `--org` | Organization prefix for import paths (`@myorg/[name]`) |
| `--skipFormat` | boolean | false | — | Skip prettier formatting (used internally for chained generators) |

### `type` Option

Controls which additional files are scaffolded beyond the base `src/` structure.

#### Auto-inference

The `type` is inferred from `name` when `type` is `generic` or omitted:

| Name | Inferred type |
|------|--------------|
| `base` | `base` |
| `logging` | `logging` |
| anything else | `generic` |

An explicit `--type` always takes precedence over inference.

## What Gets Created

### All types — base `src/` files

These files are always generated regardless of type:

```
features/[name]/src/
├── lib/
│   └── config/
│       └── env.ts          # Environment variable helpers
├── index.ts                # Public browser exports
└── server.ts               # Public server-side exports
```

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
- [Preset Generator](../preset/README.md) - Initialize first application
- [next-feature Plugin](../../README.md) - All generators

# NextFeature

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

**NextFeature** is a comprehensive **Nx plugin ecosystem** for scaffolding modern Next.js applications with zero boilerplate code. It provides an integrated set of generators, utilities, and libraries for building feature-rich applications quickly.

## What's Included

### 📦 Packages

| Package | Purpose | Version |
|---------|---------|---------|
| **next-feature** | Generator plugin for Nx | [![npm](https://img.shields.io/npm/v/next-feature)](https://www.npmjs.com/package/next-feature) |
| **@next-feature/client** | API client library with error handling | [![npm](https://img.shields.io/npm/v/@next-feature/client)](https://www.npmjs.com/package/@next-feature/client) |
| **@next-feature/logging** | pino server and browser logging | [![npm](https://img.shields.io/npm/v/@next-feature/logging)](https://www.npmjs.com/package/@next-feature/logging) |
| **create-next-feature** | CLI for creating new NextFeature workspaces | [![npm](https://img.shields.io/npm/v/create-next-feature)](https://www.npmjs.com/package/create-next-feature) |

All four are released together with the same version.

## Quick Start

### Create a New NextFeature Project

```bash
npx create-next-feature my-project
cd my-project
```

### Generate Your First Feature

```bash
# Create a feature project with all necessary setup
npx nx g next-feature:feature --name=users

# Generate an API action (auto-creates client config)
npx nx g next-feature:action --name=getUser --actionType=api --projectName=users

# Generate a React component
npx nx g next-feature:component --name=UserCard --projectName=users

# Generate a Zustand store
npx nx g next-feature:store --name=userStore --projectName=users
```

## Generator Overview

### Project Generators

Create Next.js applications and feature libraries:

- **feature** - Full-featured library with auth, axios, and client setup
- **application** - Next.js application with providers and configuration
- **client** - API client library with error handling and utilities

### Code Generators

Generate code within projects:

- **action** - Server actions (API calls or forms)
- **component** - React components with TypeScript
- **store** - Zustand state management
- **types** - TypeScript type definitions
- **constant** - Constant definitions
- **utility** - Utility functions

### Configuration Generators

Setup project infrastructure:

- **client-config** - Centralized API client configuration
- **auth** - NextAuth.js authentication
- **axios** - Axios HTTP client setup

## Key Features

### ✨ Zero Boilerplate

Generators automatically create all necessary files with sensible defaults.

```bash
# One command creates project structure with auth and API setup
npx nx g next-feature:feature --name=myfeature
```

### 🔄 Centralized Client Configuration

**Client-Config Generator** automatically creates `lib/config/client.ts` on first action:

```typescript
// Auto-generated and ready to customize (server-only)
import 'server-only';
import { ApiClient } from '@next-feature/client/server';

import { USERS_API_URL } from './env';

export const api = new ApiClient({
  baseURL: USERS_API_URL, // <PROJECT>_API_URL in .env
});

export default api;
```

Need more than one API? `npx nx g next-feature:client-config payments -p users` adds `export const payments = ...` (reading `PAYMENTS_API_URL`) to the same file, and `--apiClient=payments` on an action calls it.

Then use in actions. Generated actions are server-only; their request/response contract lives in a client-safe types file:

```typescript
// lib/actions/user.ts
import 'server-only';

import { withApi } from '@next-feature/client/server';
import api from '../config/client';
import { type GetUserRequest, type GetUserResponse } from '../types/user';

export const getUser = withApi(async (options?: GetUserRequest) => {
  return api.get<GetUserResponse>('/users');
}, {});
```

Client components never import this file directly. `--useHook` adds a `'use server'` wrapper (`lib/actions/user.action.ts`) and a TanStack Query hook that calls it, and `--actionType=form` adds `lib/actions/user.form.ts` for `useActionState`.

### 🎯 Built-in Error Handling

**@next-feature/client** provides:

- Custom `ApiError` class with status helpers
- Zod validation error extraction
- Spring Boot ProblemDetail structure support
- Error utility functions

```typescript
// ApiError.of() converts any error (ZodError, AxiosError, ProblemDetail, ...)
if (!parsed.success) {
  const apiError = ApiError.of(parsed.error);
  return { success: false, error: apiError.problemDetail };
}
```

### 🔌 Generator Chaining

Action generator automatically chains related generators:

```bash
npx nx g next-feature:action --name=getUser --actionType=api \
  --useTypes --useConstant --useMapper
```

Generates:
- ✓ Server-only action (`lib/actions/<file>.ts`, exported from `server.ts`)
- ✓ Request/response contract and TypeScript types (`lib/types/<file>.ts`, exported from `index.ts`)
- ✓ Constants
- ✓ Mapper utility, imported by the action

### 🎨 Flexible Client Setup

Choose your API client:

```bash
# Default (@next-feature/client)
npx nx g next-feature:action --name=getUser --projectName=myapp

# Custom client package
npx nx g next-feature:action --name=getUser --projectName=myapp \
  --clientPackage="@myorg/api-client"
```

## Development Commands

```bash
# Build the generator plugin
npx nx build next-feature

# Run tests
npx nx test next-feature

# Test specific generator
npx nx test next-feature --testFile='src/generators/code/action/action.spec.ts'

# Lint
npx nx lint next-feature

# Format code
npx nx format:write

# View dependency graph
npx nx graph
```

## Workspace Structure

```
.
├── next-feature/              # Generator plugin
│   ├── src/generators/
│   │   ├── code/              # API, component, store, types, constants, utilities
│   │   ├── project/           # Feature, application, client
│   │   ├── misc/              # Auth, axios, database, client-config
│   │   └── tool/              # Copy dependencies
│   └── README.md              # Plugin documentation
├── clients/
│   └── client/                # API client library
│       └── README.md          # Client library documentation
├── create-next-feature/       # CLI tool
│   └── README.md              # CLI documentation
└── README.md                  # This file
```

## Documentation

Each package includes comprehensive documentation:

- **[next-feature/README.md](./next-feature/README.md)** - Generator plugin overview and usage
- **[Feature generator README](./next-feature/src/generators/project/feature/README.md)** - `client` and `logging` feature types (the source of `@next-feature/client` and `@next-feature/logging`)
- **[create-next-feature/README.md](./create-next-feature/README.md)** - CLI tool usage

Generator-specific documentation in generator directories:

- **[next-feature/src/generators/project/client/README.md](./next-feature/src/generators/project/client/README.md)** - Client generator guide
- **[next-feature/src/generators/misc/client-config/README.md](./next-feature/src/generators/misc/client-config/README.md)** - Client config generator guide

## Common Workflows

### Workflow 1: Create Feature with API Integration

```bash
# 1. Create feature project
npx nx g next-feature:feature --name=products

# 2. Create API action (client config auto-created)
npx nx g next-feature:action --name=getProduct --actionType=api --projectName=products

# 3. Create types
npx nx g next-feature:types --name=product --projectName=products

# 4. Create React component
npx nx g next-feature:component --name=ProductCard --projectName=products

# 5. Create state management
npx nx g next-feature:store --name=productStore --projectName=products
```

### Workflow 2: Setup Authentication

```bash
# Generate the auth feature library (type is inferred from the name)
npx nx g next-feature:feature --name=auth

# Create login server action
npx nx g next-feature:action --name=login --actionType=form --projectName=auth
```

> `next-feature:application --useAuth=true` also creates this `auth` library automatically (if it doesn't already exist) and wires up the app's route handler and session provider.

### Workflow 3: Customize Client Configuration

```bash
# Generate feature
npx nx g next-feature:feature --name=api

# Create custom client config
npx nx g next-feature:client-config --projectName=api --includeInterceptors=true

# Edit lib/config/client.ts to add:
# - Authentication interceptors
# - Custom error handling
# - Request/response logging
# - Retry logic
```

## Architecture

### Generator Categories

**code/** - Individual code elements
- `action` - Server actions (API calls or forms)
- `component` - React components and App Router files
- `hook` - TanStack Query hooks for actions
- `store` - State management
- `declaration` - Data types, constants and utilities

**project/** - Complete projects
- `feature` - Feature libraries (`generic`, `logging`, `client`, `auth`, `ui`)
- `application` - Next.js applications

**misc/** - Infrastructure setup
- `client-config` - API clients (`lib/config/client.ts`)
- `dotenv` - Environment variables

**tool/** - Workspace utilities
- `copy-deps` - Dependency management

## Releases

See the [changelog](./CHANGELOG.md) and [GitHub releases](https://github.com/dcat23/next-feature/releases); both are generated on each release.

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines.

## License

MIT

## Support

- 📖 [Documentation](./next-feature/README.md)
- 🐛 [Report Issues](https://github.com/dcat23/next-feature/issues)
- 💬 [Discussions](https://github.com/dcat23/next-feature/discussions)

---

Built with [Nx](https://nx.dev) | [Next.js](https://nextjs.org) | [TypeScript](https://www.typescriptlang.org)

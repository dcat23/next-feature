# Feature Library Generator

The Feature generator creates a complete Next.js feature library with integrated development dependencies, TypeScript configuration, and optional authentication and HTTP client setup.

## Overview

The Feature generator creates a feature library (not a full application) in your monorepo that allows you to organize code by feature or domain. It provides:

- **Feature Library Structure** - Create in `libs/[name]/` or `apps/[name]/` depending on preference
- **TypeScript Path Aliases** - Automatic `@feature/[name]` import paths
- **Development Dependencies** - Includes sonner (toasts) and zod (validation)
- **Optional Setup** - Auth and Axios can be added during or after creation
- **Project Configuration** - Full Nx project configuration for building and testing

## Quick Start

### Basic Usage

```bash
# Create a feature library
npx nx g next-feature:feature --name=users
```

### With Options

```bash
# Create with authentication
npx nx g next-feature:feature --name=users --useAuth=true

# Create with HTTP client
npx nx g next-feature:feature --name=users --useAxios=true

# Both
npx nx g next-feature:feature --name=users --useAuth=true --useAxios=true

# Custom directory
npx nx g next-feature:feature --name=users --directory=libs
```

## Generator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--name` | string | required | Name of the feature library (e.g., users, products, dashboard) |
| `--directory` | string | "apps" | Directory where feature is created (apps or libs) |
| `--useAxios` | boolean | false | Setup Axios HTTP client with interceptors |
| `--useAuth` | boolean | false | Setup NextAuth.js authentication |
| `--orgName` | string | - | Organization name for scoped imports (@myorg/[name]) |
| `--skipFormat` | boolean | false | Skip prettier code formatting |

### Option Details

#### `name` (required)

Name of the feature library. This will:
- Create directory `apps/[name]/` or `libs/[name]/`
- Set up TypeScript path alias `@feature/[name]`
- Configure for code generation (actions, components, stores)

Examples: `users`, `products`, `dashboard`, `billing`, `auth`

#### `directory`

Override where the feature library is created. Default is `apps/`.

```bash
# Create in apps/ (default)
npx nx g next-feature:feature --name=users

# Create in libs/
npx nx g next-feature:feature --name=users --directory=libs

# Create in custom location
npx nx g next-feature:feature --name=users --directory=projects/features
```

#### `useAxios`

Include Axios HTTP client setup for API calls.

```bash
npx nx g next-feature:feature --name=users --useAxios=true
```

This creates `src/lib/axios/` with:
- Configured Axios instance
- Interceptors for requests/responses
- API key environment variables
- Error handling setup

#### `useAuth`

Include NextAuth.js authentication setup.

```bash
npx nx g next-feature:feature --name=auth --useAuth=true
```

This creates `src/lib/auth/` with:
- NextAuth route handlers
- Session provider setup
- Authentication utilities
- .env configuration for auth secrets

#### `orgName`

Create scoped package with organization name.

```bash
# Creates @mycompany/users import path
npx nx g next-feature:feature --name=users --orgName=mycompany

# tsconfig.base.json will include:
# "@mycompany/users/*": ["apps/users/src/*"]
```

## What Gets Created

### Directory Structure

```
apps/[name]/  (or libs/[name]/)
├── src/
│   ├── lib/
│   │   ├── actions/           # Server actions
│   │   ├── components/        # React components
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript types
│   │   ├── constants/         # Constants and enums
│   │   ├── utils/             # Utility functions
│   │   ├── axios/             # HTTP client (if --useAxios)
│   │   │   ├── instance.ts
│   │   │   └── interceptors.ts
│   │   └── auth/              # Auth setup (if --useAuth)
│   │       ├── authOptions.ts
│   │       └── routes.ts
│   ├── .env.example           # Environment variables template
│   └── index.ts               # Public API exports
├── .eslintrc.json
├── jest.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── project.json               # Nx project configuration
```

### TypeScript Path Aliases

After creating a feature, your `tsconfig.base.json` includes:

```json
{
  "compilerOptions": {
    "paths": {
      "@feature/[name]/*": ["apps/[name]/src/*"]
    }
  }
}
```

This enables clean imports:

```typescript
// Instead of: import { getUsers } from '../../../lib/actions'
import { getUsers } from '@feature/[name]/lib/actions'
```

### Default Dependencies

All features include:

```json
{
  "dependencies": {
    "sonner": "^0.x.x",
    "zod": "^3.x.x"
  }
}
```

- **sonner** - Toast notifications
- **zod** - TypeScript-first schema validation

### Optional Dependencies

#### With `--useAxios`

```json
{
  "dependencies": {
    "axios": "^1.x.x"
  }
}
```

Includes HTTP client setup at `src/lib/axios/`

#### With `--useAuth`

```json
{
  "dependencies": {
    "next-auth": "^5.x.x"
  }
}
```

Includes authentication setup at `src/lib/auth/`

## Common Workflows

### Workflow 1: Create Users Feature

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

### Workflow 2: Create Auth Feature with NextAuth

```bash
# 1. Create auth feature with NextAuth
npx nx g next-feature:feature --name=auth --useAuth=true

# 2. Create login action
npx nx g next-feature:action --name=login --actionType=form --projectName=auth

# 3. Create types
npx nx g next-feature:data-type --name=User --projectName=auth

# 4. Create authentication UI
npx nx g next-feature:component --name=LoginForm --projectName=auth
```

### Workflow 3: Create API Feature with Axios

```bash
# 1. Create API feature
npx nx g next-feature:feature --name=api --useAxios=true

# 2. Create API action
npx nx g next-feature:action --name=fetchData --actionType=api --projectName=api

# 3. Create error handler
npx nx g next-feature:utility --name=errorHandler --projectName=api

# 4. Create API types
npx nx g next-feature:data-type --name=ApiResponse --projectName=api
```

## Development Commands

### Build Feature

```bash
npx nx build [name]
```

### Run Tests

```bash
npx nx test [name]
```

### Lint Code

```bash
npx nx lint [name]
```

### Generate Code in Feature

All code generators support `--projectName` to target a feature:

```bash
# Generate component in feature
npx nx g next-feature:component --name=Button --projectName=[name]

# Generate action in feature
npx nx g next-feature:action --name=getUser --projectName=[name]

# Generate store in feature
npx nx g next-feature:store --name=userStore --projectName=[name]
```

## Generating Code in Features

### Actions (Server Functions)

```bash
npx nx g next-feature:action \
  --name=getUser \
  --actionType=api \
  --projectName=[name] \
  --useTypes \
  --useConstant
```

Creates:
- `src/lib/actions/get-user.ts` - Server action
- `src/lib/types/user.ts` - Type definitions
- `src/lib/constants/endpoints.ts` - API endpoints

### Components

```bash
npx nx g next-feature:component \
  --name=UserCard \
  --componentType=component \
  --projectName=[name]
```

Creates:
- `src/lib/components/UserCard.tsx` - React component
- `src/lib/components/UserCard.module.css` - Styles

### State Management

```bash
npx nx g next-feature:store \
  --name=userStore \
  --projectName=[name]
```

Creates `src/lib/stores/user-store.ts` with Zustand hook

### Types and Constants

```bash
# Create type
npx nx g next-feature:data-type \
  --name=User \
  --projectName=[name]

# Create constants
npx nx g next-feature:constant \
  --name=userRoles \
  --projectName=[name]
```

## Feature Best Practices

### 1. Organize by Domain

Create features around business domains:

```
libs/
├── auth/           # Authentication
├── users/          # User management
├── products/       # Product catalog
├── billing/        # Billing/payments
└── admin/          # Admin panel
```

### 2. Public API Pattern

Use `index.ts` to export public APIs:

```typescript
// apps/[name]/src/index.ts
export * from './lib/actions';
export * from './lib/components';
export { useUserStore } from './lib/stores/user-store';
export type * from './lib/types';
```

### 3. Feature Independence

Keep features independent:
- Don't import between feature libraries
- Share code via dedicated packages
- Use a shared components library if needed

### 4. Environment Variables

Create `.env.example` for documentation:

```bash
# apps/[name]/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

Copy to `.env.local` for development:

```bash
cp .env.example .env.local
```

## Configuration

### Update TypeScript Paths

If needed, update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@feature/*": ["src/*"]
    }
  }
}
```

### Configure Tailwind

Customize `tailwind.config.js`:

```javascript
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#...'
      }
    }
  }
}
```

### Setup Environment Variables

Create `.env.local` with your configuration:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_SECRET=generated-secret
DATABASE_URL=postgresql://...
```

## Sharing Features

### Publishing as NPM Package

```bash
# Build feature
npx nx build [name]

# Publish
npm publish dist/apps/[name]
```

### Monorepo Usage

Import in other features or apps:

```typescript
// In another feature
import { UserCard } from '@feature/users'
import { useUserStore } from '@feature/users'
```

## Troubleshooting

### Issue: TypeScript path aliases not working

**Solution:** Check `tsconfig.base.json`:

```bash
cat tsconfig.base.json | grep -A 10 '"paths"'
```

### Issue: Imports failing after feature creation

**Solution:** Clear Nx cache:

```bash
npx nx reset
npx nx build [name]
```

### Issue: Dependencies not installed

**Solution:** Install manually:

```bash
npm install
npx nx reset
```

## Comparison: Feature vs Application

| Feature | Feature Library | Application |
|---------|--------|-------------|
| Directory | `apps/` or `libs/` | `apps/` |
| Use Case | Domain-specific code | Runnable application |
| Imports | `@feature/[name]` | `@app/[name]` |
| Publishing | Can publish to npm | Typically deployed |
| Setup | Library structure | Full app setup |

## Next Steps

After creating a feature:

1. **Generate Code** - Create actions, components, stores
2. **Setup Configuration** - Configure auth, database, API
3. **Add Tests** - Create unit and integration tests
4. **Build & Deploy** - Build and deploy to production

## See Also

- [Preset Generator](../preset/README.md) - Initialize first application
- [Action Generator](../../code/action/README.md) - Server actions
- [Component Generator](../../code/component/README.md) - React components
- [Store Generator](../../code/store/README.md) - State management
- [next-feature Plugin](../../README.md) - All generators
- [NextFeature](../../../README.md) - Main documentation

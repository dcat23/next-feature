# NextFeature Plugin Onboarding Guide

Welcome to the NextFeature generator plugin! This guide walks you through the complete setup and development workflow for creating Next.js applications and features with the plugin.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Onboarding Workflow](#onboarding-workflow)
3. [Generator Overview](#generator-overview)
4. [Common Patterns](#common-patterns)
5. [Best Practices](#best-practices)
6. [Next Steps](#next-steps)

## Getting Started

### Prerequisites

- **Node.js** >= 18 (recommended 20+)
- **npm**, **pnpm**, or **yarn** as package manager
- **Nx workspace** already initialized

### Installation

The next-feature plugin is automatically registered when you first use any generator:

```bash
npx nx g next-feature:init
```

Or simply run any generator (init runs automatically):

```bash
npx nx g next-feature:preset --name=web
```

## Onboarding Workflow

### Step 1: Initialize Plugin (Automatic)

```bash
npx nx g next-feature:init
```

**What happens:**
- Registers next-feature plugin in `nx.json`
- Adds `lucide-react` icons library
- Configures generator system

**Documentation:** [Init Generator](./init/README.md)

### Step 2: Create Initial Application

Choose one approach:

#### Option A: Quick Setup (Recommended for most users)

```bash
npx nx g next-feature:preset --name=web
```

**Creates:**
- Application at `apps/web/`
- TypeScript path alias `@app/web`
- TailwindCSS configuration
- Environment setup

**Documentation:** [Preset Generator](./preset/README.md)

#### Option B: Full Application Control

```bash
npx nx g next-feature:application --name=web --useAuth=true --env=true
```

**Creates:**
- Full Next.js application
- Optional authentication with NextAuth
- Optional HTTP client with Axios
- TanStack Query for data fetching

**Documentation:** [Application Generator](./project/application/README.md)

### Step 3: Create Feature Libraries (Optional)

Features are reusable code organized by domain:

```bash
npx nx g next-feature:feature --name=users
npx nx g next-feature:feature --name=products
npx nx g next-feature:feature --name=billing
```

**Creates:**
- Feature library at `libs/[name]/` or `apps/[name]/`
- TypeScript path alias `@feature/[name]`
- Organized code structure
- Ready for code generation

**Documentation:** [Feature Generator](./project/feature/README.md)

### Step 4: Generate Code

Use code generators within applications or features:

```bash
# Create a component
npx nx g next-feature:component --name=Button --projectName=web

# Create a server action
npx nx g next-feature:action --name=getUser --actionType=api --projectName=users

# Create state management
npx nx g next-feature:store --name=userStore --projectName=users
```

**Documentation:** Individual generator READMEs in `code/` directory

### Step 5: Configure API Client (If Using Actions)

On first action creation, the client-config generator runs automatically:

```bash
npx nx g next-feature:action --name=getUser --actionType=api --projectName=web
```

**Creates:**
- Centralized API client at `lib/client/config.ts`
- ApiClient with error handling
- Interceptor examples

**Documentation:** [Client-Config Generator](./misc/client-config/README.md)

## Generator Overview

### Project Generators

Create entire projects or libraries.

#### [Init Generator](./init/README.md)
- **Purpose:** Register plugin and setup workspace
- **When:** Runs automatically on first use
- **Creates:** Plugin configuration in `nx.json`

#### [Preset Generator](./preset/README.md)
- **Purpose:** Quick initial application setup
- **When:** First command after workspace initialization
- **Creates:** `apps/[name]/` with full structure

#### [Application Generator](./project/application/README.md)
- **Purpose:** Create full Next.js applications
- **When:** Needing more control than preset
- **Creates:** `apps/[name]/` with optional auth and Axios

#### [Feature Generator](./project/feature/README.md)
- **Purpose:** Create feature libraries for code organization
- **When:** Building reusable domain-specific code
- **Creates:** `libs/[name]/` or `apps/[name]/` feature library

#### [Client Generator](./project/client/README.md)
- **Purpose:** Create reusable API client libraries
- **When:** Building shared client packages
- **Creates:** `clients/[name]/` with error handling and utilities

### Code Generators

Generate individual pieces of code within projects.

```
code/
├── action/         # Server actions for API/form/database
├── component/      # React components
├── store/          # Zustand state management
├── data-type/      # TypeScript type definitions
├── constant/       # Constants and enums
└── utility/        # Utility functions
```

**Common Usage:**

```bash
# All code generators use --projectName to target
npx nx g next-feature:component --name=Button --projectName=web
npx nx g next-feature:action --name=getUser --projectName=users
npx nx g next-feature:store --name=userStore --projectName=users
```

### Configuration Generators

Setup infrastructure for applications.

```
misc/
├── client-config/  # API client configuration (auto-invoked)
└── dotenv/         # .env / .env.example var management (multi-file, cross-project sync)
```

#### [Dotenv Generator](./misc/dotenv/README.md)
- **Purpose:** Create/update/remove vars across a project's `.env*` files, sync across projects, keep `lib/config/env.ts` typed
- **When:** Adding a new env var by hand, or syncing one to another project
- **Creates/updates:** `.env`, `.env.example`, any `.env.<suffix>` you target, `.gitignore`, and `lib/config/env.ts`

## Common Patterns

### Pattern 1: Simple Web Application

Start with preset, add components:

```bash
# Setup
npx nx g next-feature:preset --name=web

# Create components
npx nx g next-feature:component --name=Button --projectName=web
npx nx g next-feature:component --name=HomePage --componentType=page --projectName=web

# Create utilities
npx nx g next-feature:utility --name=helpers --projectName=web
```

### Pattern 2: Full-Stack with Authentication

Create app with auth, add features:

```bash
# Setup
npx nx g next-feature:application --name=web --useAuth=true --env=true

# Create auth feature
npx nx g next-feature:feature --name=auth

# Create user feature
npx nx g next-feature:feature --name=users

# Create API action in users feature
npx nx g next-feature:action --name=getUser --actionType=api --projectName=users

# Create types
npx nx g next-feature:data-type --name=User --projectName=users
```

### Pattern 3: Multi-Feature Monorepo

Organize by domain:

```bash
# Setup main app
npx nx g next-feature:application --name=web

# Create feature libraries
npx nx g next-feature:feature --name=auth
npx nx g next-feature:feature --name=users
npx nx g next-feature:feature --name=products
npx nx g next-feature:feature --name=billing
npx nx g next-feature:feature --name=admin

# Populate each feature with code
npx nx g next-feature:action --name=login --actionType=form --projectName=auth
npx nx g next-feature:action --name=getUser --actionType=api --projectName=users
# ... etc
```

### Pattern 4: Admin Dashboard

Create admin app with protected access:

```bash
# Setup admin app with auth
npx nx g next-feature:application --name=admin --useAuth=true --env=true

# Create dashboard feature
npx nx g next-feature:feature --name=dashboard

# Create dashboard components and actions
npx nx g next-feature:component --name=DashboardLayout --componentType=layout --projectName=dashboard
npx nx g next-feature:action --name=getDashboardMetrics --actionType=api --projectName=dashboard
```

## Best Practices

### 1. Use Features for Domain Organization

Organize code by feature or domain, not by type:

```
✅ Good
libs/
├── auth/        # Auth-related code
├── users/       # User management
└── products/    # Product catalog

❌ Avoid
libs/
├── components/  # Generic folders
├── actions/
└── types/
```

### 2. Keep Features Independent

Features should be loosely coupled:

```typescript
// ✅ Good: Feature imports from self
import { useAuthStore } from '@feature/auth'

// ❌ Avoid: Feature imports from another feature
import { useUserStore } from '@feature/users'
```

### 3. Use Public API Pattern

Export public APIs from feature index.ts:

```typescript
// libs/[feature]/src/index.ts
export * from './lib/actions'
export { useStore } from './lib/stores/my-store'
export type * from './lib/types'
```

### 4. Consistent Naming

Follow naming conventions:
- **Components:** PascalCase (`UserCard.tsx`)
- **Files:** kebab-case (`user-card.tsx`)
- **Functions:** camelCase (`getUser()`)
- **Types:** PascalCase (`User`, `UserResponse`)
- **Stores:** camelCase with "Store" suffix (`userStore`)
- **Constants:** UPPER_SNAKE_CASE (`USER_ROLES`)

### 5. Configuration in .env.local

Keep sensitive configuration in `.env.local`:

```env
# Don't commit this file
DATABASE_URL=postgresql://...
API_SECRET=secret-key
NEXTAUTH_SECRET=...
```

Use `.env.example` for documentation:

```env
# Commit this file
DATABASE_URL=postgresql://user:pass@localhost/db
API_SECRET=your-api-secret
```

## Next Steps

### After Initial Setup

1. **Configure Environment Variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit with your configuration
   ```

2. **Create First Features**
   ```bash
   npx nx g next-feature:feature --name=users
   ```

3. **Generate Code**
   ```bash
   npx nx g next-feature:component --name=UserProfile --projectName=web
   ```

4. **Run Development Server**
   ```bash
   npx nx serve web
   ```

### Learning Resources

- **Plugin Overview:** [next-feature README](../README.md)
- **Individual Generators:** Check README.md in each generator directory
- **Code Examples:** See `files/` subdirectories for templates
- **Testing:** Check `*.spec.ts` files for usage examples

### Common Commands

```bash
# List all generators
npx nx list next-feature

# Get help for specific generator
npx nx g next-feature:component --help

# View dependency graph
npx nx graph

# Build all
npx nx build

# Run tests
npx nx test

# Format code
npx nx format:write
```

## Generator Directory Structure

```
generators/
├── ONBOARDING.md              # This file
├── init/                       # Plugin initialization
├── preset/                     # Quick app setup
├── project/
│   ├── feature/               # Feature libraries
│   ├── application/           # Full Next.js apps
│   └── client/                # API client libraries
├── code/
│   ├── action/                # Server actions
│   ├── component/             # React components
│   ├── store/                 # State management
│   ├── data-type/             # Type definitions
│   ├── constant/              # Constants/enums
│   └── utility/               # Utilities
├── misc/
│   ├── client-config/         # API client config
│   └── dotenv/                 # .env / .env.example var management
└── tool/
    └── copy-deps/             # Dependency management
```

## Troubleshooting

### Plugin not found

```bash
# Ensure plugin is registered
npx nx g next-feature:init
```

### Generator not available

```bash
# Reset Nx cache
npx nx reset

# Rebuild plugin
npx nx build next-feature
```

### TypeScript paths not working

```bash
# Check tsconfig.base.json
cat tsconfig.base.json | grep -A 10 '"paths"'

# Clear cache and restart IDE
npx nx reset
```

## Support

- 📖 See individual generator README.md files for detailed documentation
- 🔍 Check template files in `files/` directories for examples
- 🧪 Review `.spec.ts` files for usage patterns
- 📝 Check root [README.md](../README.md) for plugin overview

---

**Ready to start?** Run your first command:

```bash
npx nx g next-feature:init
npx nx g next-feature:preset --name=web
```

Happy building! 🚀

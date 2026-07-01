# Preset Generator

The Preset generator sets up the initial project structure and configuration for a NextFeature workspace. It's designed to be run after workspace initialization to scaffold your first application.

## Overview

The Preset generator performs the following setup tasks:

- **Creates an initial application** at `apps/[name]/` with full Next.js structure
- **Configures TypeScript paths** with `@app/[name]` alias for imports
- **Sets up TailwindCSS configuration** with base styling configuration
- **Adds environment variables to .gitignore** to prevent accidental commits

This is a **standalone layout generator** (`x-use-standalone-layout: true`) typically invoked immediately after initializing the next-feature plugin.

## Quick Start

### Basic Usage

```bash
# Run preset generator with project name
npx nx g next-feature:preset --name=myapp
```

### With Options

```bash
# Specify custom directory
npx nx g next-feature:preset --name=myapp --directory=projects

# View help with all options
npx nx g next-feature:preset --help
```

## Generator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--name` | string | required | Name of the project (creates `apps/[name]/`) |
| `--directory` | string | - | Override where the project is created |
| `--skipFeature` | boolean | false | Skip creating default feature library structure |
| `--skipFormat` | boolean | false | Skip prettier code formatting |

### Option Details

#### `name` (required)

Name of the application to create. This will:
- Create directory `apps/[name]/`
- Set up TypeScript path alias `@app/[name]`
- Configure project structure for Next.js development

Examples: `myapp`, `dashboard`, `admin`, `web`

#### `directory`

Override the default `apps/` directory location.

```bash
# Create in libs/ instead of apps/
npx nx g next-feature:preset --name=mylib --directory=libs
```

#### `skipFeature`

Skip creating the feature library structure within the application.

```bash
npx nx g next-feature:preset --name=myapp --skipFeature=true
```

## What Gets Created

### Directory Structure

```
apps/[name]/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── lib/
│   │   ├── actions/           # Server actions
│   │   ├── components/        # React components
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript types
│   │   ├── constants/         # Constants and enums
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── styles/                # CSS modules and styles
├── .env.local                 # Local environment variables
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # TailwindCSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Project dependencies
└── project.json               # Nx project configuration
```

### TypeScript Path Aliases

After running preset, your `tsconfig.base.json` will include:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/[name]/*": ["apps/[name]/src/*"]
    }
  }
}
```

This allows clean imports like:

```typescript
// Instead of: import { Button } from '../../../components/Button'
import { Button } from '@app/[name]/components/Button'
```

### Environment Variables

The `.env` files are automatically added to `.gitignore`:

```
.env
.env.local
.env.prod
```

Create `.env.local` for development configuration:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

### TailwindCSS Configuration

A base TailwindCSS configuration is generated with:

- **Content paths** configured for `src/**/*.{js,ts,jsx,tsx}`
- **Theme configuration** with sensible defaults
- **Plugin setup** ready for extensions
- **Dark mode support** pre-configured

## Typical Workflow

### Step 1: Initialize Workspace

```bash
npx nx list
```

This registers the next-feature plugin (via init generator).

### Step 2: Run Preset Generator

```bash
npx nx g next-feature:preset --name=web
```

This creates your first application at `apps/web/`.

### Step 3: Create Features

```bash
# Navigate to the app
cd apps/web

# Create your first feature
npx nx g next-feature:feature --name=users
```

### Step 4: Generate Code

```bash
# Create API action
npx nx g next-feature:action --name=getUser --actionType=api --projectName=web

# Create component
npx nx g next-feature:component --name=UserCard --projectName=web

# Create store
npx nx g next-feature:store --name=userStore --projectName=web
```

## Development Workflow

### Run Development Server

```bash
cd apps/[name]
npm run dev
```

### Build Application

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

## Next Steps After Setup

### 1. Configure API Client

If you plan to make API calls:

```bash
npx nx g next-feature:action --name=getUser --actionType=api --projectName=[name]
```

This automatically creates `src/lib/client/config.ts` for centralized API configuration.

### 2. Setup Authentication

For apps requiring authentication:

```bash
npx nx g next-feature:feature --name=auth --useAuth=true
npx nx g next-feature:auth --projectName=auth
```

### 3. Add Database Operations

For database-driven features (expects Prisma configured in the project):

```bash
npx nx g next-feature:action --name=getUsers --actionType=db --projectName=[name]
```

### 4. Customize Configuration

Update configuration files as needed:

- **`next.config.js`** - Next.js configuration options
- **`tailwind.config.js`** - Styling theme and plugins
- **`.env.local`** - Environment variables
- **`tsconfig.json`** - TypeScript compiler options

## Troubleshooting

### Issue: TypeScript path aliases not working

**Solution:** Ensure `tsconfig.json` has correct paths:

```bash
# Verify paths in tsconfig.base.json
cat tsconfig.base.json | grep -A 5 '"paths"'
```

### Issue: Styles not applying

**Solution:** Verify TailwindCSS setup:

```bash
# Check tailwind.config.js content paths
cat tailwind.config.js | grep -A 3 'content:'
```

### Issue: Path not found for preset

**Solution:** Ensure next-feature plugin is initialized:

```bash
# Check nx.json for plugin registration
cat nx.json | grep -A 5 '"plugins"'

# If missing, run init generator
npx nx g next-feature:init
```

## Integration with Other Generators

The Preset generator works with other next-feature generators:

```bash
# Create feature libraries
npx nx g next-feature:feature --name=[feature] --projectName=[app-name]

# Generate code
npx nx g next-feature:component --name=MyComponent --projectName=[app-name]
npx nx g next-feature:action --name=myAction --actionType=api --projectName=[app-name]
npx nx g next-feature:store --name=myStore --projectName=[app-name]
```

## File Changes Summary

The generator:

✅ **Creates new files** - App structure, configurations, layouts
✅ **Updates existing files** - `tsconfig.base.json`, `.gitignore`, `nx.json`
✅ **Generates templates** - TailwindCSS config from templates
✅ **Adds environment configuration** - Gitignore entries for `.env` files

## See Also

- [next-feature Plugin](../../README.md) - Complete generator overview
- [Feature Generator](../project/feature/README.md) - Create feature libraries
- [NextFeature](../../../README.md) - Main ecosystem documentation
- [@next-feature/client](../../../clients/client/README.md) - API client library

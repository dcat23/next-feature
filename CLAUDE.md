# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextFeature is an Nx workspace containing a **generator plugin** that scaffolds Next.js feature modules with boilerplate code. The plugin provides generators for creating projects, code structures (APIs, components, stores), and configurations (auth, database, axios).

Key technologies:
- **Nx 20.8.1** - Monorepo framework
- **Next.js 15.2** - React framework
- **TypeScript** - Language
- **Jest + Vitest** - Testing frameworks
- **TailwindCSS** - Styling
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **NextAuth** - Authentication

## Common Development Commands

```bash
# Build the generator plugin
npx nx build next-feature

# Run tests for the plugin
npx nx test next-feature

# Run tests for a specific generator (e.g., api)
npx nx test next-feature --testFile='src/generators/code/api/api.spec.ts'

# Lint all files
npx nx lint next-feature

# Format files with prettier
npx nx format:write

# Run a specific generator (e.g., create an API)
npx nx g next-feature:api --name=getUserProfile --projectName=myfeature

# Run e2e tests
npx nx test next-feature-e2e

# View the dependency graph
npx nx graph
```

## Architecture Overview

The plugin follows an Nx plugin structure with generators organized by category:

### Generator Categories

**Project Generators** (`src/generators/project/`)
- `feature` - Creates a feature project with Next.js library, auth, and axios setup
- `application` - Creates a Next.js application

**Code Generators** (`src/generators/code/`)
- `api` - Generates API methods with axios integration, types, constants, and optional mappers
- `component` - Generates React components
- `store` - Generates Zustand stores
- `types` - Generates TypeScript type definitions
- `constant` - Generates constant definitions
- `utils` - Generates utility functions

**Misc Generators** (`src/generators/misc/`)
- `auth` - Adds NextAuth configuration
- `axios` - Adds axios HTTP client setup
- `database` - Adds database configuration

**Tool Generators** (`src/generators/tool/`)
- `copy-deps` - Copies dependencies between projects

**Special Generators**
- `init` - Initializes workspace configuration
- `preset` - Applies predefined configurations

### Core Libraries

**Generator Config** (`src/lib/generator-config.ts`)
- `initializeGenerator()` - Initializes projects and configuration. Automatically creates a feature project if needed. Returns project paths and configuration.

**Utilities** (`src/lib/utils/index.ts`)
- `updateDependencies()` - Updates package.json dependencies
- `updateNxJson()` - Updates Nx workspace configuration

**Constants** (`src/lib/constants/`)
- `versions.ts` - Package version constants (SONNER_VERSION, ZOD_VERSION, NEXTAUTH_VERSION, etc.)

**DotEnv Module** (`src/lib/dotenv/`)
- Handles environment variable configuration and parsing

**Type System** (`src/lib/types.ts`)
- Base generator schema interfaces used across all generators

## Generator Pattern

All generators follow a consistent pattern:

1. **Schema Definition** - Schema file (e.g., `schema.json`) and schema type (e.g., `schema.d.ts`)
2. **Normalize Function** - Transforms options and calculates derived values (e.g., className, endpoint)
3. **Main Generator Function** - Orchestrates file generation and chains related generators
4. **File Templates** - EJS templates in `files/` subdirectory that get populated with normalized options

### Key Generator Options

- `name` (required) - Base name for generated code (normalized to className, propertyName, fileName)
- `projectName` - Target project (auto-creates feature if not found)
- `package` - Subdirectory within `src/` (default: 'lib')
- `directory` - Override default directory path
- `skipFormat` - Skip prettier formatting (used for chained generators)

### Generator Chaining

Generators can invoke other generators via `runTasksInSerial()`:
- API generator can create types, constants, and mapper utilities
- Feature generator chains auth and axios setup
- This avoids duplication and ensures consistent setup

## Testing

Tests use Jest and follow the pattern `*.spec.ts`:

```bash
# Run single test file
npx nx test next-feature -- --testFile='src/generators/code/api/api.spec.ts'

# Run with coverage
npx nx test next-feature -- --coverage

# Watch mode
npx nx test next-feature -- --watch
```

Test files typically:
- Mock the Nx Tree filesystem
- Create test schemas with required options
- Call the generator and assert on generated files
- Verify file content (API structure, imports, etc.)

## File Generation with EJS Templates

Generated files use EJS template syntax:
- Files in `files/` subdirectory with `__tmpl__` suffix
- Variables replaced: `<%= fileName %>`, `<%= className %>`, etc.
- Special handling for TypeScript imports and exports
- Non-TS files (JSON, env templates) also processed

## Managing Dependencies

Use `updateDependencies()` when adding packages:
```typescript
updateDependencies(tree, [
  { package: 'zustand', version: '^5.0.6', type: 'regular' },
  { package: '@types/node', version: '^20.0.0', type: 'dev' }
]);
```

## Nx Configuration

Key configuration in `nx.json`:
- `generators` section defines generator defaults (e.g., default projectName for api, component, store)
- Plugins configured: `@nx/eslint`, `@nx/next` with custom target names
- Target defaults cache test, lint, and build results
- Release configuration uses git tags

## Git Integration

Current branch: `0.0.11` (release branch)
Main branch: `main` (for PRs)

Use git tags for versioning: `v0.0.11`, etc.

## Common Task Patterns

**Adding a new generator type:**
1. Create directory in `src/generators/[category]/[name]/`
2. Create `schema.json` with options
3. Create `[name].ts` with normalize + main generator function
4. Create `schema.d.ts` with TypeScript types
5. Add optional `.spec.ts` tests
6. Register in `generators.json`
7. Add entry to `src/index.ts` if exported

**Updating generated code templates:**
- Modify EJS templates in `files/` subdirectories
- Update test files to validate new output
- Consider backwards compatibility with existing projects

**Generator-to-generator communication:**
- Use `initializeGenerator()` to ensure target project exists
- Pass options via spread operator: `{ ...normalizedOptions, name: derivedName }`
- Use `skipFormat: true` in chained generators to avoid multiple formatting

## Build Output

Built files go to `dist/next-feature/`:
- Compiled JavaScript in `dist/next-feature/src/`
- Templates copied to `dist/next-feature/src/generators/[...]/files/`
- `generators.json` and optional `executors.json` copied to root of dist
- `.md` files included for documentation

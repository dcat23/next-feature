# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextFeature is an Nx workspace containing a **generator plugin ecosystem** that scaffolds Next.js feature modules with zero boilerplate code. The workspace includes:

- **next-feature** - Generator plugin for Nx
- **@next-feature/client** - API client library with error handling and utilities
- **create-next-feature** - CLI tool for creating new NextFeature workspaces

The plugin provides generators for creating projects, server actions (API, form, database), components, stores, and configurations (auth, database, client-config).

Key technologies:
- **Nx 22.0.3** - Monorepo framework
- **Next.js 15.2** - React framework with Server Actions
- **TypeScript** - Language
- **Jest + Vitest** - Testing frameworks
- **TailwindCSS** - Styling
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **NextAuth** - Authentication
- **Zod** - Validation with built-in error extraction

## Common Development Commands

```bash
# Build the generator plugin
npx nx build next-feature

# Run tests for the plugin
npx nx test next-feature

# Run tests for a specific generator (e.g., action)
npx nx test next-feature --testFile='src/generators/code/action/action.spec.ts'

# Lint all files
npx nx lint next-feature

# Format files with prettier
npx nx format:write

# Run a specific generator (e.g., create a server action)
npx nx g next-feature:action --name=getUser --actionType=api --projectName=myfeature

# Run e2e tests
npx nx test next-feature-e2e

# View the dependency graph
npx nx graph
```

## Architecture Overview

The plugin follows an Nx plugin structure with generators organized by category:

### Generator Categories

**Project Generators** (`src/generators/project/`)
- `feature` - Creates a feature project with Next.js library
- `application` - Creates a Next.js application
- `client` - Creates an API client library with error handling

**Code Generators** (`src/generators/code/`)
- `action` - Generates Next.js server actions (API, form, or database operations) with client integration
- `component` - Generates React components
- `store` - Generates Zustand stores
- `data-type` - Generates TypeScript type definitions
- `constant` - Generates constant definitions
- `utility` - Generates utility functions

**Misc Generators** (`src/generators/misc/`)
- `client-config` - Creates centralized API client configuration (auto-invoked by action generator)
- `auth` - Adds NextAuth configuration
- `axios` - Adds axios HTTP client setup
- `database` - Adds database configuration

**Tool Generators** (`src/generators/tool/`)
- `copy-deps` - Copies dependencies between projects

**Special Generators**
- `init` - Initializes workspace configuration
- `preset` - Applies predefined configurations

### Core Libraries

**Code Generator Utilities** (`src/lib/utils/code-generator.ts`)
- `initializeCodeGenerator()` - Initializes code generators. Auto-creates feature project if needed. Returns project paths and configuration.
- `normalizeCodeGenerator()` - Normalizes code generator options, handles name transformations and export paths.

**Project Generator Utilities** (`src/lib/utils/index.ts`)
- `initializeProjectGenerator()` - Initializes project generators and updates Nx configuration.
- `updateDependencies()` - Updates package.json dependencies.
- `addToGitignore()` - Adds entries to .gitignore files.

**Client Library** (`clients/client/src/`)
- `ApiError` - Custom error class with status helpers (isUnauthorized, isNotFound, etc.)
- `ApiError.fromZodError()` - Converts Zod validation errors to API errors.
- `ApiErrorBuilder` - Fluent builder for creating API errors with ProblemDetail structure.
- `ProblemDetail` - Spring Boot-compatible error response interface.

**Constants** (`src/lib/constants/`)
- `versions.ts` - Package version constants (SONNER_VERSION, ZOD_VERSION, NEXTAUTH_VERSION, etc.)
- `PLUGIN_NAME` - Plugin identifier for Nx configuration.

**Type System** (`src/lib/types.ts`)
- `CodeGeneratorSchema` - Base schema for code generators.
- `ProjectGeneratorSchema` - Base schema for project generators.
- Normalized variants with computed fields.

## Generator Pattern

All generators follow a consistent pattern:

1. **Schema Definition** - Schema file (e.g., `schema.json`) and schema type (e.g., `schema.d.ts`)
2. **Normalize Function** - Transforms options and calculates derived values (e.g., className, endpoint)
3. **Main Generator Function** - Orchestrates file generation and chains related generators
4. **File Templates** - EJS templates in `files/` subdirectory that get populated with normalized options

### Key Generator Options

**Code Generators:**
- `name` (required) - Base name for generated code (normalized to className, propertyName, fileName)
- `projectName` - Target project (auto-creates feature if not found)
- `package` - Subdirectory within `src/` (default: 'lib')
- `file` - Custom file name (overrides derived fileName)
- `export` - Whether to add export to package index (default: false)
- `skipFormat` - Skip prettier formatting (used for chained generators)

**Action Generator Specific:**
- `actionType` - Type of action: 'api', 'form', or 'database'
- `clientPackage` - Custom API client package (default: '@next-feature/client')
- `useTypes` - Auto-generate TypeScript types
- `useConstant` - Auto-generate constants
- `useMapper` - Auto-generate mapper utility

**Project Generators:**
- `orgName` - Organization name for scoped packages (e.g., '@myorg')
- `directory` - Custom directory path (overrides default based on name)

### Generator Chaining

Generators can invoke other generators via `runTasksInSerial()`:
- Action generator auto-creates client-config if it doesn't exist
- Action generator can chain data-type, constant, and utility generators based on options
- Feature generator chains auth and axios setup
- This avoids duplication and ensures consistent setup

**Important:** When chaining generators, pass `skipFormat: true` to avoid multiple formatting passes.

## Testing

Tests use Jest and follow the pattern `*.spec.ts`:

```bash
# Run single test file
npx nx test next-feature -- --testFile='src/generators/code/action/action.spec.ts'

# Run with coverage
npx nx test next-feature -- --coverage

# Watch mode
npx nx test next-feature -- --watch

# Test client library (uses Vitest)
npx nx test client
```

Test files typically:
- Mock the Nx Tree filesystem using `createTree()` or `createTreeWithEmptyWorkspace()`
- Create test schemas with required options
- Call the generator and assert on generated files
- Verify file content (action structure, imports, error handling, etc.)
- Test generator chaining and auto-creation behavior

## File Generation with EJS Templates

Generated files use EJS template syntax:
- Files in `files/` subdirectory with `__tmpl__` suffix
- Variables replaced: `<%= fileName %>`, `<%= className %>`, `<%= names.propertyName %>`, etc.
- Special handling for TypeScript imports and exports
- Non-TS files (JSON, env templates) also processed
- Action generator has multiple template variants in `files/src/` based on `actionType`
- Template naming: `__outputFileName__.__extension__.ejs__tmpl__` gets processed to remove `__tmpl__` suffix

## Managing Dependencies

Use `updateDependencies()` when adding packages:
```typescript
updateDependencies(
  tree,
  { 'zustand': '^5.0.6' },  // regular dependencies
  { '@types/node': '^20.0.0' },  // dev dependencies
  projectRoot  // optional: project-specific path
);
```

Version constants are centralized in `src/lib/constants/versions.ts`:
```typescript
import { SONNER_VERSION, ZOD_VERSION, NEXTAUTH_VERSION } from '../lib/constants/versions';
```

## Nx Configuration

Key configuration in `nx.json`:
- `generators.next-feature` section defines generator defaults (e.g., default projectName for action, component, store)
- Plugins configured: `@nx/eslint/plugin`, `@nx/next/plugin` with custom target names
- Target defaults cache test, lint, and build results
- Release configuration uses git tags and runs `pnpm dlx nx run-many -t build` before versioning

Generators are registered in `next-feature/generators.json`:
- Maps generator names to factory functions and schemas
- Each generator entry includes factory path, schema path, and description

## Git Integration

Main branch: `main` (for PRs)
Current version: `0.1.0` (migrating to Nx 22.0.3)

Use git tags for versioning: `v0.1.0`, etc.

Package manager: `pnpm` (use `pnpm install`, not npm or yarn)

## Common Task Patterns

**Adding a new code generator:**
1. Create directory in `src/generators/code/[name]/`
2. Create `schema.json` with options (extend `CodeGeneratorSchema`)
3. Create `[name].ts` with normalize function and main generator
4. Create `schema.d.ts` with TypeScript types
5. Create `files/` subdirectory with EJS templates
6. Add `.spec.ts` tests
7. Register in `generators.json`
8. Export from generator file for reuse

**Adding a new project generator:**
1. Create directory in `src/generators/project/[name]/`
2. Create `schema.json` with options (extend `ProjectGeneratorSchema`)
3. Use `initializeProjectGenerator()` to set up Nx configuration
4. Chain other generators as needed (auth, axios, etc.)
5. Update `nx.json` generators section with default `orgName`

**Updating generated code templates:**
- Modify EJS templates in `files/` subdirectories
- Update test files to validate new output
- Consider backwards compatibility with existing projects
- Test with different `actionType` values if applicable

**Working with the client library:**
- Client library exports from `clients/client/src/index.ts` (browser)
- Server-side exports from `clients/client/src/server.ts` (Node.js)
- Use `ApiError.fromZodError()` for form validation errors
- Use `ApiError.builder()` for custom error construction

## Server Actions Architecture

The action generator creates Next.js server actions with built-in error handling:

**Action Types:**
- `api` - HTTP API calls using configured client (default: @next-feature/client)
- `form` - Form submission handlers with Zod validation
- `database` - Database operations (typically with Prisma)

**Client Configuration Pattern:**
- First action in a project auto-creates `lib/client/config.ts`
- Centralizes API client setup (base URL, interceptors, etc.)
- Actions import from `../client/config` for consistent configuration
- Customizable per-project (auth headers, retry logic, etc.)

**Error Handling Pattern:**
Generated actions follow this pattern:
```typescript
try {
  const result = await api.get<User>(`/users/${id}`);
  return { success: true, data: result };
} catch (error) {
  const apiError = ApiError.of(error);
  return { success: false, message: apiError.message, error: apiError.problemDetail };
}
```

**Response Types:**
All actions return `ApiResponse<T>`:
- Success: `{ success: true, data: T }`
- Failure: `{ success: false, message: string, error?: ProblemDetail }`

## Build Output

Built files go to `dist/next-feature/`:
- Compiled JavaScript in `dist/next-feature/src/`
- Templates copied to `dist/next-feature/src/generators/[...]/files/`
- `generators.json` copied to root of dist
- `.md` files included for documentation

Client library output in `dist/clients/client/`:
- Dual exports: `index.js` (browser) and `server.js` (Node.js)
- Type definitions for all exports

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextFeature is an Nx workspace containing a **generator plugin ecosystem** that scaffolds Next.js feature modules with zero boilerplate code. The workspace includes:

- **next-feature** - Generator plugin for Nx
- **@next-feature/client** - API client library with error handling and utilities
- **create-next-feature** - CLI tool for creating new NextFeature workspaces

The plugin provides generators for creating projects, server actions (API, form, database), components, stores, and configurations (client-config).

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
- `feature` - Creates a feature project with Next.js library. The `type` option selects scaffolding: `generic` (default), `logging`, `client` (API client library with error handling), `auth` (NextAuth.js configuration), or `ui` (shadcn-ready component library: `components.json` at the project root whose aliases keep shadcn files under `components/ui`, `lib/ui` and `hooks/ui`, Tailwind v4 entry, plus a `shadcn` target for pulling in components later; `shadcn init` writes the `cn()` util)
- `application` - Creates a Next.js application

**Code Generators** (`src/generators/code/`)
- `action` - Generates server-only actions (API, form, or database operations) plus a client-safe request/response contract, and `'use server'` wrappers only for calls that originate in client components (see Server Actions Architecture)
- `component` - Generates React components (`kind=form` imports `ApiResponse` from `clientPackage`, default `@next-feature/client`). `componentType` is `component` (default), `page` (App Router route files) or `ui`; `kind` selects the file (`generic`, `modal`, `card`, `form` for components; `layout`, `loading`, `error`, `not-found`, `template`, `default`, `global-error`, `route` for pages). `componentType=ui` adds a shadcn component to a `ui`-type feature library instead: no template is written, it invokes the shared shadcn CLI helper (`lib/utils/shadcn.ts`, also used by the `shadcn` executor) to run `npx shadcn@latest add <slug>` in the target project's root, skipping if the component file already exists
- `hook` - Generates a TanStack Query hook (`useQuery` for GET-derived actions, `useMutation` otherwise) that calls an action's `'use server'` wrapper (`<actionFile>.action.ts`) and imports its request type from `lib/types/<actionFile>`, in `src/hooks/`. Auto-invoked by the `action` generator when `useHook` is set
- `store` - Generates Zustand stores
- `declaration` - Generates a declaration by `kind`: `data-type` (TypeScript types), `constant` or `utility`. Data types and constants are exported from `index.ts`, utilities from `server.ts`

**Misc Generators** (`src/generators/misc/`)
- `client-config` - Creates centralized API client configuration (auto-invoked by action generator)
- `dotenv` - Creates, updates, or removes environment variables across a project's `.env*` files, optionally syncing the same change to other projects, and keeps `lib/config/env.ts`'s zod schema/accessors in sync (see `src/lib/dotenv/`)

**Tool Generators** (`src/generators/tool/`)
- `copy-deps` - Copies dependencies between projects

**Special Generators**
- `init` - Initializes workspace configuration
- `preset` - Applies predefined configurations

### Executors (`src/executors/`)

Unlike generators (which scaffold files once), executors run as Nx targets (`nx run <project>:<target>`) against an existing project.

- `shadcn` - Runs `npx shadcn@latest <action> [--preset=<preset>] [args]` in a project's root (e.g. `npx nx run ui:shadcn --args="button"`, `--action=init --preset=nova`). `action` is `add` (default, applied in code, not as a schema default), `init`, or `apply`; `preset` is only valid with `init`/`apply` (truthy check). Argument building lives in `buildShadcnArgs()` (`lib/utils/shadcn.ts`); `args` beginning with a shadcn command and no `action` are passed through as-is for backwards compatibility. Auto-registered as a `shadcn` target on `feature --type=ui` projects, where `components.json` resolves the shadcn aliases.

### Core Libraries

**Code Generator Utilities** (`src/lib/utils/code-generator.ts`)
- `initializeCodeGenerator()` - Initializes code generators. Throws if `projectName` is missing (no implicit default project); auto-creates a named feature project that doesn't exist yet, and records `projectName` as the generator's `nx.json` default. Returns project paths, `projectName`, and `projectType` (`application` | `library`, via `resolveProjectType()`, which falls back to detecting `next.config.*`). Code generators skip `index.ts`/`server.ts` exports for applications.
- `normalizeCodeGenerator()` - Normalizes code generator options, handles name transformations and export paths.

**Project Generator Utilities** (`src/lib/utils/index.ts`)
- `initializeProjectGenerator()` - Initializes project generators and updates Nx configuration.
- `updateDependencies()` - Updates package.json dependencies.
- `addToGitignore()` - Adds entries to .gitignore files (idempotent - safe to call repeatedly).
- `addNamedImports()` (`lib/utils/imports.ts`) - Adds named specifiers to a file, merging into an existing import from the same module. Used to accumulate per-action imports when several actions share one file.
- `exportFile()` (`lib/export-file.ts`) - Adds a sorted `export *` to `index.ts` or `server.ts`; for `server.ts` it also ensures `import 'server-only'` at the top.

**Dotenv Utilities** (`src/lib/dotenv/`)
- `updateDotenv()` / `syncDotenv()` (`dot-env.ts`) - Set/unset vars across a project's (or multiple projects') `.env`/`.env.example`/`.env.<suffix>` files, grouped under `### SECTION ###` headers, preserving comments/blank lines. Non-`.env.example` files touched this way are auto-gitignored.
- `updateEnvConfig()` (`env-config.ts`) - Keeps a project's `lib/config/env.ts` zod schema and `process.env` accessors in sync with the same key set, via `/* schema start/end */` and `/* vars start/end */` markers. The schema property, exported accessor, and `.env` key are always the same name (e.g. `USERS_API_URL`). Called by `feature`/`application`/`client-config` generators directly, and exposed as a standalone generator via `misc/dotenv`.

**Client Library** (`features/client/src/`, generated from the `client` feature template)
- `ApiError` - Custom error class with status helpers (isUnauthorized, isNotFound, etc.)
- `ApiError.of()` - Converts any error (ApiError, AxiosError, ZodError, ProblemDetail) to an `ApiError`. Axios and zod errors are detected by shape (`isAxiosError()`, `isZodError()`), and a `ProblemDetail` (e.g. `ApiResponse.error`) is detected with `isProblemDetail()`.
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
- `projectName` (required) - Target project, from `-p`, the interactive prompt (existing projects only) or the generator's `nx.json` default (Nx merges `nx.json` defaults before prompting and validating; `nx.json` keys must be camelCase). Auto-creates a feature if the named project doesn't exist (except `client-config`, which needs an existing project)
- `package` - Subdirectory within `src/` (default: 'lib')
- `file` - Custom file name (overrides derived fileName)
- `export` - Whether to add export to package index (default: false)
- `skipFormat` - Skip prettier formatting (used for chained generators)

**Action Generator Specific:**
- `actionType` - Type of action: 'api', 'form', or 'db'. `form` also writes a `<file>.form.ts` `'use server'` form action
- `clientPackage` - Custom API client package (default: '@next-feature/client'); `withApi`/`withForm` are imported from `<clientPackage>/server`
- `useTypes` - Auto-generate a data-type interface, appended to the contract file `lib/types/<file>.ts`
- `useConstant` - Auto-generate constants
- `useMapper` - Auto-generate a mapper in `lib/utils/<file>.ts`, imported and applied by the action
- `useHook` - Auto-generate a TanStack Query hook (`hooks/use-<name>.ts`) and the `<file>.action.ts` `'use server'` wrapper it calls; ignored when `actionType` is `form`

**Hook Generator Specific:**
- `name` - Name of the action to wrap (e.g. `getUsers`); determines the hook name (`use<Name>`) and whether `useQuery` or `useMutation` is used, via the same HTTP-method-prefix detection as the action generator
- `actionPackage` - Subdirectory where the wrapped action lives (default: `lib/actions`, matching the action generator's default)
- `actionFile` - Exact file (without extension) the wrapped action was written to, if it differs from the default resource-based name. The hook imports `<actionPackage>/<actionFile>.action` and `lib/types/<actionFile>`
- `clientPackage` - Client package to import `ApiError` from (default: `@next-feature/client`)

**Project Generators:**
- `orgName` - Organization name for scoped packages (e.g., '@myorg')
- `directory` - Custom directory path (overrides default based on name)

### Generator Chaining

Generators can invoke other generators via `runTasksInSerial()`:
- Action generator auto-creates client-config if it doesn't exist
- Action generator can chain data-type, constant, and utility declarations based on options. It passes the bare file name (declarations add `.ts`) and `package: 'lib'` for data-type/utility so they land in `lib/types/<file>.ts` / `lib/utils/<file>.ts`
- Declaration exports follow `DECLARATION_KINDS[kind].exportFile`: data-type and constant go to `index.ts`, utility to `server.ts`
- Action generator chains the `hook` generator when `useHook` is set (ignored for `actionType=form`), scaffolding a `useQuery`/`useMutation` hook that wraps the generated action
- Feature generator adds the axios dependency and registers a `<NAME>_API_URL` var (in `.env`/`.env.example` and `lib/config/env.ts`) when `env` is set
- Application generator does the same when `env` is set, and creates a sibling `auth`-type feature (if missing) when `useAuth` is set
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

Generator specs that call `formatFiles()` need prettier's dynamic import, and the full suite can run out of memory on all cores. If tests fail with "A dynamic import callback was invoked without --experimental-vm-modules" or get OOM-killed, run jest from `next-feature/` with:
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest --testTimeout=60000 -w 2
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
- Action generator templates are header-only (directive + imports): `files/server` (server-only action), `files/action` (`'use server'` wrapper), `files/form` (`'use server'` form action). Bodies come from content functions in `action/lib/utils/content.ts`
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

**Published feature libraries** (`feature` generator): every package a feature's vite build leaves `external` must be declared in the feature's own `package.json` (copied to `dist/` and published) via `updatePackageJsonDependencies()` (`project/feature/utils`). `react`/`react-dom` are `peerDependencies` (the app must share one copy), as is `next-auth` for `auth` (must match the app's `next-auth/react` `SessionProvider`); everything else (`server-only`, `zod`, plus `axios` for `client`, `pino*` for `logging`) is a regular dependency on a caret range of the version constant (`asCaretRange()`), so an app on another major can't change the library's behaviour. `addRollupExternalPackages()` string entries match exact module ids only; pass a `RegExp` (e.g. `/^next-auth\//`) for packages imported through subpaths. This only works because library code never relies on class identity for values created by the app's copy of a package: the `client` template detects errors with `axios.isAxiosError()` and `isZodError()` (shape check, zod 3 and 4) instead of `instanceof`. Keep it that way. After changing feature dependencies, regenerate the features and run `pnpm install` so `pnpm-lock.yaml` stays in sync (CI uses `--frozen-lockfile`).

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

Executors are registered in `next-feature/executors.json` (currently just `shadcn`), following the same implementation/schema/description shape as generator entries.

## Git Integration

Main branch: `main` (for PRs). Work is tracked in GitHub issues (bug/change forms) and milestones; branch as `<type>/<issue>-<slug>` and close issues with `Closes #<n>` in the PR.

Versions come from conventional commits (`nx release`, fixed relationship across all four packages, tags `v<version>`). While the major is 0, a breaking change bumps the minor (`adjustSemverBumpsForZeroMajorVersion`). Release with the Release workflow:
- beta: `specifier: auto` + `prerelease` (never `specifier: prerelease`, which ignores the commits)
- graduate a beta: `specifier: patch`
- stable notes only list commits since the last tag, so paste the migration table for breaking changes into the GitHub release

Commit conventions:
- `type(scope): subject`, scopes as in the issue forms; breaking changes use `type(scope)!:` plus a `BREAKING CHANGE:` footer with the migration
- Nx reads a `BREAKING CHANGE:` note to the end of the message, so in breaking commits put the co-author line after a `---------` line (`Co-authored-by: ...`) to end the note there
- `docs`, `chore`, `ci`, `test` commits are hidden from the changelog and don't bump the version

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
4. Chain other generators as needed (dotenv, etc.)
5. Update `nx.json` generators section with default `orgName`

**Updating generated code templates:**
- Modify EJS templates in `files/` subdirectories
- Update test files to validate new output
- Consider backwards compatibility with existing projects
- Test with different `actionType` values if applicable

**Working with the client library:**
- `@next-feature/client` is generated from the `client` feature template into `features/client` (and `@next-feature/logging` from `logging` into `features/logging`); regenerate them after changing those templates
- Client-safe exports from `features/client/src/index.ts` (`ApiError`, types, error utils)
- Server-only exports from `features/client/src/server.ts` (`ApiClient`, `withApi`, `withForm`)
- Use `ApiError.of(zodError)` for form validation errors (field messages land in `problemDetail.errors`, keyed by dotted path; issues without a path, e.g. an object-level `.refine()`, go under `FORM_ERROR_KEY` (`'_form'`))
- Use `ApiError.builder()` for custom error construction

## Server Actions Architecture

The action generator separates server and client code so server modules never reach a client bundle, and only calls that originate in client components become server action endpoints.

**Generated files** (`getUsers --file=user`; without `--file` the singular resource name is used):

| File | Header | Contents | Export (libraries, with `export`) |
|------|--------|----------|------------------|
| `lib/types/user.ts` | none | `getUsersSchema` (only when the method has a body), `GetUsersRequest`, `GetUsersResponse` | `index.ts` |
| `lib/actions/user.ts` | `import 'server-only'` | `getUsers = withApi(...)`, for RSC, route handlers and server code | `server.ts` |
| `lib/actions/user.action.ts` | `'use server'` | `getUsersAction`, only with `useHook` | none |
| `lib/actions/user.form.ts` | `'use server'` | `getUsersFormAction = withForm(...)` plus a FormData parser, only for `actionType=form` | none |

Rules:
- Request/response schemas and types go in the contract file so client components can import them for forms and typing
- Action files never carry `'use server'`; they import `'server-only'`
- `'use server'` wrappers exist only for client-originated calls and use the `Action` suffix (`<name>Action`, `<name>FormAction`), distinct from the `form` action type
- Every feature `server.ts` and `lib/config/client.ts` starts with `import 'server-only'`; `server-only` is a feature dependency and a vite `external`
- In the `client`/`logging` feature templates, modules that read server env or only run on the server also import `'server-only'` and are exported only from `server.ts`: `ApiClient` (`lib/client.ts`), `withApi`/`withForm` (`lib/actions/with-api.ts`), and `pinoOptions` (`config.ts`), the server `logger` (`lib/server.ts`) and `registerPino` (`lib/utils`). `index.ts` stays client-safe
- Applications get the same files but no `index.ts`/`server.ts` exports

**Action Types:**
- `api` - HTTP API calls using configured client (default: @next-feature/client)
- `form` - Same server-only action, plus a `<file>.form.ts` form action for `useActionState`
- `db` - Database operations (typically with Prisma)

**Client Configuration Pattern:**
- First action in a project auto-creates `lib/config/client.ts`
- Centralizes API client setup (base URL, interceptors, etc.)
- Actions import from `../config/client` for consistent configuration
- Customizable per-project (auth headers, retry logic, etc.)

**Error Handling Pattern:**
Generated actions are wrapped in `withApi`, which catches errors and converts them with `ApiError.of()`:
```typescript
export const getUsers = withApi(async (options?: GetUsersRequest) => {
  const response = await api.get<GetUsersResponse>(endpoint);
  return response;
}, {});
// => { success: true, data } | { success: false, message, error: ProblemDetail }
```
`error` is the plain `ProblemDetail`, not the `ApiError` instance: React can't serialize class instances returned from `'use server'` actions (in production an `Error` arrives as a generic, message-redacted `Error`). Client code rehydrates it with `ApiError.of(response.error)` (`handleApiError` recognises the shape via `isProblemDetail()`), which keeps `status`, `isNotFound` etc. and the field `errors` map.

**Response Types:**
All actions return `ApiResponse<T>`:
- Success: `{ success: true, data: T }`
- Failure: `{ success: false, message: string, error?: ProblemDetail }`

## Build Output

Built files go to `dist/next-feature/`:
- Compiled JavaScript in `dist/next-feature/src/`
- Templates copied to `dist/next-feature/src/generators/[...]/files/`
- `generators.json` and `executors.json` copied to root of dist
- `.md` files included for documentation

Feature library output in `dist/features/client/` and `dist/features/logging/`:
- Dual exports: `index.js` (client-safe) and `server.js` (`server-only`)
- Type definitions for all exports

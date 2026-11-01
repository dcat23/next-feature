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
- `feature` - Creates a feature project with Next.js library. The `type` option selects scaffolding: `generic` (default), `logging`, `client` (API client library with error handling), `auth` (NextAuth.js v5 for a Credentials provider backed by the app's API: backend tokens live only in the encrypted JWT, refreshed in the `jwt` callback with a deduplicated per-refresh-token cache in `lib/auth/tokens.ts`, never exposed by the `session` callback; server code reads them with the `'server-only'` `getAccessToken()`, which throws inside `runAuthFlow()` (an `AsyncLocalStorage` scope around `login()`/`refresh()`, preventing a self-refresh deadlock or a stale user's token; the build keeps `next` and `node:async_hooks` external); `login()`/`refresh()` stubs in `lib/auth/backend.ts`), or `ui` (shadcn-ready component library: `components.json` at the project root whose aliases keep shadcn files under `components/ui`, `lib/ui` and `hooks/ui`, Tailwind v4 entry, plus a `shadcn` target for pulling in components later; `shadcn init` writes the `cn()` util)
- `application` - Creates a Next.js application

**Code Generators** (`src/generators/code/`)
- `action` - Generates server-only actions (API calls or forms) plus a client-safe request/response contract, and `'use server'` wrappers only for calls that originate in client components (see Server Actions Architecture)
- `component` - Generates React components (`kind=form` imports `ApiResponse` from `clientPackage`, default `@next-feature/client`). `componentType` is `component` (default), `page` (App Router route files) or `ui`; `kind` selects the file (`generic`, `modal`, `card`, `form` for components; `layout`, `loading`, `error`, `not-found`, `template`, `default`, `global-error`, `route` for pages). `componentType=ui` adds a shadcn component to a `ui`-type feature library instead: no template is written, it invokes the shared shadcn CLI helper (`lib/utils/shadcn.ts`, also used by the `shadcn` executor) to run `npx shadcn@latest add <slug>` in the target project's root, skipping if the component file already exists
- `hook` - Generates a TanStack Query hook (`useQuery` for GET-derived actions, `useMutation` otherwise) that calls an action's `'use server'` wrapper (`<actionFile>.action.ts`) and imports its request type from `lib/types/<actionFile>`, in `src/hooks/`. Auto-invoked by the `action` generator when `useHook` is set
- `store` - Generates Zustand stores
- `declaration` - Generates a declaration by `kind`: `data-type` (TypeScript types), `constant` or `utility`. Data types and constants are exported from `index.ts`, utilities from `server.ts`

**Misc Generators** (`src/generators/misc/`)
- `client-config` - Adds a named, configured `ApiClient` (`name`, default `api`) to `lib/config/client.ts`, a regular code generator (`initializeCodeGenerator()`, appended via `writeCodeFile()`). The first client in the file is also its `default` export (what actions import); more clients are appended as named exports and never change the default. Each reads its base URL from its own env var: `<PROJECT>_API_URL` for `api`, `<NAME>_API_URL` otherwise, or `envVar`. Files from earlier versions (one unnamed default client) count as the `api` client. In a feature library it also declares `@next-feature/client` (caret range) in the library's `package.json` (so the vite build keeps it external), even when the client already exists; custom `clientPackage`s aren't declared. `baseUrl`/`includeInterceptors` are `x-deprecated` and ignored. Auto-invoked by the action generator
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
- `updateDependencies()` - Adds package.json dependencies (workspace root by default, or `{ projectRoot }`; a string still works) and returns the install task. Installed packages keep their version unless `{ updateExistingVersions: true }`, which raises (never lowers) them: used for `@next-feature/client`/`@next-feature/logging`, whose generated code needs this release's API.
- `addToGitignore()` - Adds entries to .gitignore files (idempotent - safe to call repeatedly).
- `addNamedImports()` / `addDefaultImport()` (`lib/utils/imports.ts`) - Adds named specifiers / a default import to a file, merging into an existing import from the same module (including `Default, { named }` forms). Used to accumulate per-action imports when several actions share one file.
- `exportFile()` (`lib/export-file.ts`) - Adds a sorted `export *` to `index.ts` or `server.ts`; for `server.ts` it also ensures `import 'server-only'` at the top.

**Dotenv Utilities** (`src/lib/dotenv/`)
- `updateDotenv()` / `syncDotenv()` (`dot-env.ts`) - Set/unset vars across a project's (or multiple projects') `.env`/`.env.example`/`.env.<suffix>` files (only `.env.example` with `exampleOnly`, for optional overrides whose default lives in code), grouped under `### SECTION ###` headers, preserving comments/blank lines. Non-`.env.example` files touched this way are auto-gitignored.
- `updateEnvConfig()` (`env-config.ts`) - Keeps a project's `lib/config/env.ts` zod schema and `process.env` accessors in sync with the same key set. `set` is a key list (`z.string()`, an existing key keeps its schema) or a `{ KEY: schema }` record (e.g. `z.string().optional()`), via `/* schema start/end */` and `/* vars start/end */` markers. The schema property, exported accessor, and `.env` key are always the same name (e.g. `USERS_API_URL`). Called by `feature`/`application`/`client-config` generators directly, and exposed as a standalone generator via `misc/dotenv`.

**Client Library** (`features/client/src/`, generated from the `client` feature template)
- `ApiError` - Custom error class with status helpers (isUnauthorized, isNotFound, etc.)
- `ApiError.of()` - Converts any error (ApiError, AxiosError, ZodError, ProblemDetail) to an `ApiError`. Axios and zod errors are detected by shape (`isAxiosError()`, `isZodError()`), and a `ProblemDetail` (e.g. `ApiResponse.error`) is detected with `isProblemDetail()`.
- `ApiClient` (`lib/client.ts`, server-only) - Axios wrapper. Clients are module-level and shared by every server request, so never keep per-request state on the instance: token refreshes are keyed by the expired `Authorization` header (`refreshes` map). Retries only cover `retryMethods` (idempotent by default) and honour `Retry-After`. Optional `userAgent`, `headers` and `logger` (pino-compatible, console by default). Tested in `features/client/src/lib/client.spec.ts` with a fake axios adapter
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
- `projectName` (required) - Target project, from `-p`, the interactive prompt (existing projects only) or the generator's `nx.json` default (Nx merges `nx.json` defaults before prompting and validating; `nx.json` keys must be camelCase). Auto-creates a feature if the named project doesn't exist
- `package` - Subdirectory within `src/` (default: 'lib')
- `file` - Custom file name (overrides derived fileName)
- `export` - Whether to add export to package index (default: false)
- `skipFormat` - Skip prettier formatting (used for chained generators)

**Action Generator Specific:**
- `actionType` - Type of action: 'api' or 'form'. `form` also writes a `<file>.form.ts` `'use server'` form action
- `clientPackage` - Custom API client package (default: '@next-feature/client'); `withApi`/`withForm` are imported from `<clientPackage>/server`
- `useTypes` - Auto-generate a data-type interface, appended to the contract file `lib/types/<file>.ts`
- `useConstant` - Auto-generate constants
- `useMapper` - Auto-generate a mapper in `lib/utils/<file>.ts`, imported and applied by the action
- `apiClient` - Named client from `lib/config/client.ts` to call (`import { <name> }`), created via `client-config` if missing; default: the file's default export (`import api`). The config import path is computed from `package`. Several clients in one action file merge into `import api, { payments } from ...` (`addDefaultImport()`/`addNamedImports()`)
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
- Action generator auto-creates client-config if it doesn't exist, or the named client when `apiClient` is set
- Action generator can chain data-type, constant, and utility declarations based on options. It passes the bare file name (declarations add `.ts`) and `package: 'lib'` for data-type/utility so they land in `lib/types/<file>.ts` / `lib/utils/<file>.ts`
- Declaration exports follow `DECLARATION_KINDS[kind].exportFile`: data-type and constant go to `index.ts`, utility to `server.ts`
- Action generator chains the `hook` generator when `useHook` is set (ignored for `actionType=form`), scaffolding a `useQuery`/`useMutation` hook that wraps the generated action
- `<NAME>_API_URL` vars come from `client-config` (one per client, also run by the first action); `feature`/`application` have no `env` option
- Application generator creates a sibling `auth`-type feature (if missing) when `useAuth` is set
- Application generator always writes `proxy.ts` (Next 16 middleware) with a matcher for API routes and pages, skipping `_next` and static files; with `useAuth` it's `auth((request) => ...)` from the auth feature's `/server` entry (the proxy runs on Node.js and Next allows `server-only` in it; the auth feature's `index.ts` exports types only, since `authConfig` reaches server code), which refreshes the session cookie without redirecting (a custom handler makes next-auth ignore `authorized`'s `false`)
- Application generator wires `@next-feature/logging` unless `skipLogging`: `instrumentation.ts` dynamically imports `registerPino` from `@next-feature/logging/server` on the `nodejs` runtime and passes the app's `lib/config/logging.ts` options (`createPinoOptions({ service: '<name>' })`, plus a server `logger`); `app/api/log/route.ts` receives browser beacons. These files, and the logger import in `error.tsx`, only exist when logging is enabled
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
  { projectRoot, updateExistingVersions }  // optional: <projectRoot>/package.json; raise installed versions
);
```

**Published feature libraries** (`feature` generator): a feature's `vite.config.mts` externalizes exactly what its own `package.json` (copied to `dist/` and published) declares in `dependencies`/`peerDependencies`, including subpath imports, read at build time (`externalizeDeclaredDependencies()`, `lib/utils/vite-config.ts`). Declare a package and it stays out of `dist/`; packages that must stay external without being declared go in the config's `extraExternals` (`thread-stream` for `logging`). The generator declares its packages via `updatePackageJsonDependencies()` (`project/feature/utils`); `shadcn add` installs into the `ui` project's `package.json`, so those stay external too, and `syncShadcnDependencies()` converts older static `external: [...]` configs on disk. `react`/`react-dom` are `peerDependencies` (the app must share one copy), as is `next-auth` for `auth` (must match the app's `next-auth/react` `SessionProvider`); everything else (`server-only`, `zod`, plus `axios` for `client`, `pino*` for `logging`) is a regular dependency on a caret range of the version constant (`asCaretRange()`), so an app on another major can't change the library's behaviour. This only works because library code never relies on class identity for values created by the app's copy of a package: the `client` template detects errors with `axios.isAxiosError()` and `isZodError()` (shape check, zod 3 and 4) instead of `instanceof`. Keep it that way. After changing feature dependencies, regenerate the features and run `pnpm install` so `pnpm-lock.yaml` stays in sync (CI uses `--frozen-lockfile`).

Version constants are centralized in `src/lib/constants/versions.ts`:
```typescript
import { SONNER_VERSION, ZOD_VERSION, NEXTAUTH_VERSION } from '../lib/constants/versions';
```

## Nx Configuration

Key configuration in `nx.json`:
- `generators.next-feature` section defines generator defaults (e.g., default projectName for action, component, store)
- Plugins configured: `@nx/eslint/plugin`, `@nx/next/plugin` with custom target names
- Target defaults cache test, lint, and build results
- Lint fails on any warning: `maxWarnings: 0` for the `@nx/eslint:lint` executor (`nx lint <project>`) and `--max-warnings=0` for the inferred `eslint:lint` target CI runs. Fix or explicitly `eslint-disable` (with a reason) new warnings
- Release configuration uses git tags and runs `pnpm dlx nx run-many -t build` before versioning

Generators are registered in `next-feature/generators.json`:
- Maps generator names to factory functions and schemas
- Each generator entry includes factory path, schema path, and description

Executors are registered in `next-feature/executors.json` (currently just `shadcn`), following the same implementation/schema/description shape as generator entries.

## Git Integration

Main branch: `main` (for PRs). Work is tracked in GitHub issues (bug/change forms) and milestones; branch as `<type>/<issue>-<slug>` and close issues with `Closes #<n>` in the PR.

Versions come from conventional commits (`nx release`, fixed relationship across all four packages, tags `v<version>`). While the major is 0, a breaking change bumps the minor (`adjustSemverBumpsForZeroMajorVersion`). Release with the Release workflow:
- beta: `specifier: auto` + `prerelease` (from a stable version: the commit-derived bump as a beta; from a beta: the next beta)
- graduate a beta: `specifier: patch`
- the workflow fails on inputs that would silently release something else (`prerelease` with a forced specifier; `auto` without `prerelease` when the latest tag is a beta) and writes the resolved version to the job summary, also on dry runs
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
- Client-safe exports from `features/client/src/index.ts` (`ApiError`, types, error utils, and the `'use client'` `ApiErrorBoundary`/`useApiError`)
- Server-only exports from `features/client/src/server.ts` (`ApiClient`, `withApi`, `withForm`)
- Use `ApiError.of(zodError)` for form validation errors (field messages land in `problemDetail.errors`, keyed by dotted path; issues without a path, e.g. an object-level `.refine()`, go under `FORM_ERROR_KEY` (`'_form'`))
- Use `ApiError.builder()` for custom error construction

**Logging env vars are optional overrides:** defaults live in code, so `NEXT_PUBLIC_LOGGING_BEACON_PATH` (default `DEFAULT_LOGGING_BEACON_PATH`, `/api/log`, the route the application generator creates) and `LOGGING_SERVICE_NAME` (overrides the `service` passed to `createPinoOptions()`) are typed `z.string().optional()` and written to `.env.example` only (`LOGGING` in `lib/dotenv/constants/defaults.ts`). Don't make them required again; the route's URL comes from its file location, so the log route must not read the beacon var.

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
- Every feature `server.ts` and `lib/config/client.ts` starts with `import 'server-only'`; `server-only` is a declared feature dependency (so also external)
- In the `client`/`logging` feature templates, modules that read server env or only run on the server also import `'server-only'` and are exported only from `server.ts`: `ApiClient` (`lib/client.ts`), `withApi`/`withForm` (`lib/actions/with-api.ts`), and `createPinoOptions`/`pinoOptions` (`config.ts`), the server `logger` (`lib/server.ts`) and `registerPino` (`lib/utils`). `index.ts` stays client-safe
- Applications get the same files but no `index.ts`/`server.ts` exports

**Action Types:**
- `api` - HTTP API calls using configured client (default: @next-feature/client)
- `form` - Same server-only action, plus a `<file>.form.ts` form action for `useActionState`

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
- One file per source module (`preserveModules`): the `preserveUseClient` plugin in each feature's `vite.config.mts` (added by `preserveUseClientBoundaries()`, `lib/utils/vite-config.ts`) re-adds `'use client'` to modules whose source starts with it, since Rollup drops module-level directives. That's what lets server components render `GlobalErrorHandler` etc. from the package
- Type definitions for all exports

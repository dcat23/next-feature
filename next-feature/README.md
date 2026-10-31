# Next-Feature Plugin

Comprehensive Nx plugin for scaffolding Next.js applications with generators for projects, APIs, components, state management, and infrastructure setup.

## Overview

The next-feature plugin provides a complete set of generators organized into categories:

- **Project Generators** - Create feature libraries and applications
- **Code Generators** - Generate individual code elements (APIs, components, stores, etc.)
- **Configuration Generators** - Setup infrastructure (client config, dotenv, etc.)
- **Tool Generators** - Workspace utilities

## Quick Reference

### Project Generators

```bash
# Create a feature library
npx nx g next-feature:feature --name=users

# Create a Next.js application
npx nx g next-feature:application --name=myapp

# Create an API client library
npx nx g next-feature:feature --name=apiClient --type=client

# Create a NextAuth.js configuration library
npx nx g next-feature:feature --name=auth --type=auth

# Create a shadcn-ready ui component library
npx nx g next-feature:feature --name=ui --type=ui
```

### Code Generators

```bash
# Server actions for API calls, forms, or database operations
npx nx g next-feature:action --name=getUser --projectName=users

# React components
npx nx g next-feature:component --name=UserCard --projectName=users

# TanStack Query hook wrapping an existing server action (useQuery/useMutation)
npx nx g next-feature:hook --name=getUser --projectName=users

# Zustand state management stores
npx nx g next-feature:store --name=userStore --projectName=users

# TypeScript type definitions
npx nx g next-feature:types --name=user --projectName=users

# Constants and enums
npx nx g next-feature:constant --name=userRoles --projectName=users

# Utility functions
npx nx g next-feature:utility --name=userHelpers --projectName=users
```

### Configuration Generators

```bash
# Centralized API client configuration (auto-invoked by action generator)
npx nx g next-feature:client-config --projectName=users

# Create/update/remove env vars across .env* files (and keep env.ts in sync)
npx nx g next-feature:dotenv --projectName=users --set=API_URL=http://localhost:8080
```

### Executors

```bash
# Pull shadcn components into a ui-type feature (target is auto-registered when the feature is created)
npx nx run ui:shadcn --args="add button"
npx nx run ui:shadcn --args="add button card dialog"
npx nx run ui:shadcn --action=init --preset=nova
npx nx run ui:shadcn --action=apply --preset=nova
```

## Key Features

### 🔄 Auto-Invoked Client Configuration

When you create your first action, the **client-config generator** automatically runs:

```bash
npx nx g next-feature:action --name=getUser --actionType=api --projectName=users
```

This automatically creates `lib/config/client.ts` with:
- API base URL configuration
- Interceptor examples
- Error handling setup
- Ready to customize

### 🎯 Generator Chaining

Action generator automatically chains related generators:

```bash
npx nx g next-feature:action --name=getUser --actionType=api \
  --useTypes --useConstant --useMapper --useHook
```

Generates in sequence:
1. Request/Response contract in `lib/types/<file>.ts`
2. Server-only action in `lib/actions/<file>.ts`
3. TypeScript types, appended to the contract file (if --useTypes)
4. Constants (if --useConstant)
5. Mapper utility in `lib/utils/<file>.ts`, imported by the action (if --useMapper)
6. TanStack Query hook plus its `'use server'` wrapper (if --useHook; ignored for `--actionType=form`) - `useQuery` for GET-derived actions, `useMutation` otherwise

### 🔒 Server/Client Boundaries

Actions are split so server code never ends up in a client bundle and only calls that start in client components become server action endpoints:

| File | Directive | Contents | Exported from |
|------|-----------|----------|---------------|
| `lib/types/<file>.ts` | none | Zod request schema, `<Name>Request` / `<Name>Response` types | `index.ts` |
| `lib/actions/<file>.ts` | `import 'server-only'` | `withApi`-wrapped action, for RSC, route handlers and other server code | `server.ts` |
| `lib/actions/<file>.action.ts` | `'use server'` | `<name>Action` wrapper, only with `--useHook` | - |
| `lib/actions/<file>.form.ts` | `'use server'` | `<name>FormAction` (`withForm`, for `useActionState`), only with `--actionType=form` | - |

```bash
npx nx g next-feature:action --name=getUsers --file=user --useHook --export --projectName=users
```

```typescript
// Server component: call the server-only action directly
import { getUsers } from '@feature/users/server';

// Client component: use the hook (calls getUsersAction) and the client-safe contract
import { useGetUsers, type GetUsersRequest } from '@feature/users';
```

`server.ts` always starts with `import 'server-only'`, so importing it from a client component fails the build. In applications the same files are generated, but nothing is exported since apps have no `index.ts`/`server.ts` entrypoints.

### ✨ Zod Validation Error Handling

Automatically handles form validation errors:

```typescript
import { ApiError } from '@next-feature/client';

if (!schema.safeParse(formData).success) {
  const apiError = ApiError.fromZodError(parsed.error);
  return { success: false, error: apiError.problemDetail };
}
```

### 🎨 Flexible Client Support

Use any API client package:

```bash
# Default (@next-feature/client)
npx nx g next-feature:action --name=getUser --projectName=myapp

# Custom client
npx nx g next-feature:action --name=getUser --projectName=myapp \
  --clientPackage="@myorg/api-client"
```

## Generator Categories

### code/ - Individual Code Elements

Generate self-contained pieces of functionality:

- **action** - Server actions (API, form, database operations)
- **component** - React components (`--componentType=component`) or Next.js App Router route files (`--componentType=page`), with `--kind` selecting the specific file (modal/card/form, or page/layout/loading/error/route etc.)
- **hook** - TanStack Query hook (`useQuery`/`useMutation`) wrapping an existing server action; auto-invoked by `action` when `--useHook` is set
- **store** - Zustand state management hooks
- **types** - TypeScript type definitions
- **constant** - Constants and enums
- **utility** - Utility functions

### project/ - Complete Projects

Generate entire project structures:

- **feature** - Feature library; `--type=client` scaffolds an API client library with error handling and utilities, `--type=ui` scaffolds a shadcn-ready component library
- **application** - Next.js application with layout, providers, routing

### misc/ - Infrastructure Configuration

Setup project infrastructure:

- **client-config** - Centralized API configuration (auto-invoked by actions)
- **dotenv** - Create/update/remove `.env*` vars, sync across projects, keep `env.ts` typed

NextAuth.js authentication is a `feature` type (`--type=auth`), not a separate misc generator.

### tool/ - Workspace Utilities

- **copy-deps** - Copy dependencies between projects

### executors/ - Nx Targets Run Against a Project

Unlike generators, executors run via `nx run <project>:<target>` against a project that already exists:

- **shadcn** - Runs `npx shadcn@latest <action> [--preset=<preset>] [args]` in a project's root. `--action` is `add` (default), `init`, or `apply`; `--preset` is only allowed with `init`/`apply`. Legacy `--args` that start with a shadcn command (e.g. `--args="add button"`) are passed through unchanged. Auto-registered as the `shadcn` target when a `feature --type=ui` project is created.

## Common Workflows

### Workflow: Create Feature with Full API Integration

```bash
# 1. Create feature project
npx nx g next-feature:feature --name=products

# 2. Create API action (automatically creates client config)
npx nx g next-feature:action --name=getProduct --actionType=api --projectName=products

# 3. Create types
npx nx g next-feature:types --name=product --projectName=products

# 4. Create component
npx nx g next-feature:component --name=ProductCard --projectName=products

# 5. Create state management
npx nx g next-feature:store --name=productStore --projectName=products

# 6. Customize client config
editor apps/products/src/lib/config/client.ts
```

### Workflow: Setup Authentication

```bash
# Create the auth feature library (type is inferred from the name)
npx nx g next-feature:feature --name=auth

# Create login action
npx nx g next-feature:action --name=login --actionType=form --projectName=auth

# Create user store
npx nx g next-feature:store --name=userStore --projectName=auth
```

### Workflow: Add Database Operations

```bash
# Create data feature
npx nx g next-feature:feature --name=data

# Create database action (expects Prisma configured in the project)
npx nx g next-feature:action --name=getUserFromDb --actionType=db --projectName=data

# Create database utilities
npx nx g next-feature:utility --name=dbHelpers --projectName=data
```

## Development

### Build

```bash
npx nx build next-feature
```

### Test

```bash
# Run all tests
npx nx test next-feature

# Run specific test
npx nx test next-feature --testFile='src/generators/code/action/action.spec.ts'

# Watch mode
npx nx test next-feature -- --watch
```

### Lint

```bash
npx nx lint next-feature
```

### Format

```bash
npx nx format:write
```

## Generator Options Reference

### Common Options (All Generators)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --name | string | required | Name for the generated code |
| --projectName, -p | string | required | Target project. Can be set once as the generator's default in `nx.json` (`generators["next-feature"].<generator>.projectName`; also written automatically on first run). A name that doesn't exist yet is created as a feature library |
| --directory | string | - | Override default directory |
| --package | string | "lib" | Package subdirectory in src/ |
| --skipFormat | boolean | false | Skip prettier formatting |

### Action Generator

```bash
npx nx g next-feature:action --name=getUser [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --actionType | enum | "api" | Type: api, db, or form. `form` also generates `<file>.form.ts` |
| --file | string | - | Base file name for the action, contract (`lib/types/`) and wrappers. Defaults to the singular resource name (`getUsers` → `user`) |
| --export | boolean | false | Export the contract from `index.ts` and the action from `server.ts` (libraries only) |
| --useTypes | boolean | false | Append a data-type interface to the contract file |
| --useConstant | boolean | false | Generate constants |
| --useMapper | boolean | false | Generate a mapper utility in `lib/utils/` and import it in the action |
| --useHook | boolean | false | Generate a TanStack Query hook and the `<file>.action.ts` wrapper it calls (ignored for `actionType=form`) |
| --clientPackage | string | "@next-feature/client" | Client library to import |

### Component Generator

```bash
npx nx g next-feature:component --name=Button [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --componentType | enum | "component" | Bucket: `component` (basic React component), `page` (App Router route file), or `ui` (shadcn component added to a `ui`-type feature library) |
| --kind | enum | "generic" | Specific file within componentType. component: generic, modal, card, form. page: generic (page.tsx), layout, loading, error, not-found, template, default, global-error, route. Not used for `ui`. |
| --inferPath | boolean | false | componentType `page`: derive the nested route from `name` instead of `--package` |

`--componentType=ui` doesn't scaffold a template file — it invokes the shadcn CLI (via the same mechanism as the `next-feature:shadcn` executor) to add the component into the target `ui`-type feature, e.g.:

```bash
npx nx g next-feature:component --name=Button --componentType=ui --projectName=ui
npx nx g next-feature:component --name=AlertDialog --componentType=ui --projectName=ui
```

If the component file already exists (`<ui-lib>/src/components/common/<slug>.tsx`), it's skipped rather than re-added.

### Hook Generator

```bash
npx nx g next-feature:hook --name=getUser --projectName=users [options]
```

Wraps an existing server action in a `useQuery` (GET-derived actions) or `useMutation` (all others) hook, using the same name-prefix detection as the action generator. `getUsers` produces `hooks/use-get-users.ts` exporting `useGetUsers`, which calls `getUsersAction` from `<actionPackage>/<actionFile>.action` and imports `GetUsersRequest` from `lib/types/<actionFile>`. The action generator creates both when `--useHook` is set.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --actionPackage | string | "lib/actions" | Subdirectory where the wrapped action lives |
| --actionFile | string | - | Exact file (without extension) the action was written to, if not the default resource-based name |
| --clientPackage | string | "@next-feature/client" | Client package to import `ApiError` from |

### Store Generator

```bash
npx nx g next-feature:store --name=userStore [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --storeType | enum | "zustand" | Type: zustand or context |

### Feature Generator

```bash
npx nx g next-feature:feature --name=users [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --type | enum | "generic" | Type: generic, base, logging, client, auth, or ui |
| --orgName | string | - | Scoped organization name |

`--type=client` registers a `<NAME>_API_URL` variable in this feature's `.env`/`.env.example`. `--type=ui` registers a `shadcn` executor target on the project (see [Executors](#executors)).

### Client-Config Generator

```bash
npx nx g next-feature:client-config --projectName=users [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --clientPackage | string | "@next-feature/client" | Client to configure |
| --baseUrl | string | "process.env.NEXT_PUBLIC_API_URL" | API base URL |
| --includeInterceptors | boolean | true | Include interceptor examples |

## API Reference

### Project Structure Generated

**Feature Project:**
```
apps/myfeature/
├── src/
│   ├── lib/
│   │   ├── config/
│   │   │   └── client.ts          (auto-created on first action)
│   │   ├── actions/               (server-only actions + 'use server' .action/.form wrappers)
│   │   ├── components/            (React components)
│   │   ├── hooks/                 (TanStack Query hooks / generic hooks)
│   │   ├── stores/                (Zustand stores)
│   │   ├── types/                 (request/response contracts, TypeScript types)
│   │   ├── constants/             (Constants)
│   │   └── utils/                 (Utility functions)
│   └── ...
├── project.json
├── package.json
└── ...
```

## Troubleshooting

### Issue: Client config not created

**Solution:** Manually create it:
```bash
npx nx g next-feature:client-config --projectName=yourproject
```

### Issue: Import path errors

**Solution:** Verify project name:
```bash
npx nx list --affected
npx nx list --projects myproject
```

### Issue: Template variables not replaced

**Solution:** Ensure generator ran successfully:
```bash
npx nx build next-feature
npx nx test next-feature
```

## See Also

- [Root README](../../README.md) - Overview of NextFeature ecosystem
- [@next-feature/client Documentation](../../clients/client/README.md) - API client library
- [Generator-specific READMEs](src/generators/) - Detailed generator documentation

## Contributing

See [CLAUDE.md](../../CLAUDE.md) for development guidelines.

## License

MIT

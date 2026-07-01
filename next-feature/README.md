# Next-Feature Plugin

Comprehensive Nx plugin for scaffolding Next.js applications with generators for projects, APIs, components, state management, and infrastructure setup.

## Overview

The next-feature plugin provides a complete set of generators organized into categories:

- **Project Generators** - Create feature libraries and applications
- **Code Generators** - Generate individual code elements (APIs, components, stores, etc.)
- **Configuration Generators** - Setup infrastructure (auth, client config, axios, etc.)
- **Tool Generators** - Workspace utilities

## Quick Reference

### Project Generators

```bash
# Create a feature library with auth and client setup
npx nx g next-feature:feature --name=users

# Create a Next.js application
npx nx g next-feature:application --name=myapp

# Create an API client library
npx nx g next-feature:feature --name=apiClient --type=client
```

### Code Generators

```bash
# Server actions for API calls, forms, or database operations
npx nx g next-feature:action --name=getUser --projectName=users

# React components
npx nx g next-feature:component --name=UserCard --projectName=users

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

# NextAuth.js authentication setup
npx nx g next-feature:auth --projectName=users

# Axios HTTP client configuration
npx nx g next-feature:axios --projectName=users
```

## Key Features

### 🔄 Auto-Invoked Client Configuration

When you create your first action, the **client-config generator** automatically runs:

```bash
npx nx g next-feature:action --name=getUser --actionType=api --projectName=users
```

This automatically creates `lib/client/config.ts` with:
- API base URL configuration
- Interceptor examples
- Error handling setup
- Ready to customize

### 🎯 Generator Chaining

Action generator automatically chains related generators:

```bash
npx nx g next-feature:action --name=getUser --actionType=api \
  --useTypes --useConstant --useMapper
```

Generates in sequence:
1. Server action file
2. TypeScript types (if --useTypes)
3. Constants (if --useConstant)
4. Mapper utility (if --useMapper)

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
- **component** - React components with TypeScript
- **store** - Zustand state management hooks
- **types** - TypeScript type definitions
- **constant** - Constants and enums
- **utility** - Utility functions

### project/ - Complete Projects

Generate entire project structures:

- **feature** - Feature library; `--type=client` scaffolds an API client library with error handling and utilities
- **application** - Next.js application with layout, providers, routing

### misc/ - Infrastructure Configuration

Setup project infrastructure:

- **client-config** - Centralized API configuration (auto-invoked by actions)
- **auth** - NextAuth.js authentication with routes
- **axios** - Axios HTTP client with interceptors

### tool/ - Workspace Utilities

- **copy-deps** - Copy dependencies between projects

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
editor apps/products/src/lib/client/config.ts
```

### Workflow: Setup Authentication

```bash
# Create auth feature
npx nx g next-feature:feature --name=auth

# Add NextAuth setup
npx nx g next-feature:auth --projectName=auth

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
| --projectName | string | "base" | Target project for generation |
| --directory | string | - | Override default directory |
| --package | string | "lib" | Package subdirectory in src/ |
| --skipFormat | boolean | false | Skip prettier formatting |

### Action Generator

```bash
npx nx g next-feature:action --name=getUser [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --actionType | enum | "api" | Type: api, db, or form |
| --useTypes | boolean | true | Generate type files |
| --useConstant | boolean | true | Generate constants |
| --useMapper | boolean | false | Generate mapper utility |
| --clientPackage | string | "@next-feature/client" | Client library to import |

### Component Generator

```bash
npx nx g next-feature:component --name=Button [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| --componentType | enum | "component" | Type: component, card, modal, form, etc. |

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
| --type | enum | "generic" | Type: generic, base, logging, or client |
| --orgName | string | - | Scoped organization name |
| --useAxios | boolean | false | Chain the axios generator (lib/axios/) into the feature |

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
│   │   ├── client/
│   │   │   └── config.ts          (auto-created on first action)
│   │   ├── actions/               (server actions)
│   │   ├── components/            (React components)
│   │   ├── stores/                (Zustand stores)
│   │   ├── types/                 (TypeScript types)
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

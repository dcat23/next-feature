# NextFeature v0.1.0

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

**NextFeature** is a comprehensive **Nx plugin ecosystem** for scaffolding modern Next.js applications with zero boilerplate code. It provides an integrated set of generators, utilities, and libraries for building feature-rich applications quickly.

## What's Included

### 📦 Packages

| Package | Purpose | Version |
|---------|---------|---------|
| **next-feature** | Generator plugin for Nx | v0.1.0 |
| **@next-feature/client** | API client library with error handling | v0.1.0 |
| **create-next-feature** | CLI for creating new NextFeature workspaces | v0.1.0 |

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

- **action** - Server actions (API, form, or database operations)
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
- **database** - Prisma database configuration

## Key Features

### ✨ Zero Boilerplate

Generators automatically create all necessary files with sensible defaults.

```bash
# One command creates project structure with auth and API setup
npx nx g next-feature:feature --name=myfeature
```

### 🔄 Centralized Client Configuration

**Client-Config Generator** automatically creates `lib/client/config.ts` on first action:

```typescript
// Auto-generated and ready to customize
import { ApiClient } from '@next-feature/client';

const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

export default apiClient;
```

Then use in actions:

```typescript
import api from '../client/config';
import { ApiError, type ApiResponse } from '@next-feature/client';

export async function getUser(id: string): Promise<ApiResponse<User>> {
  try {
    const user = await api.get<User>(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    const apiError = ApiError.of(error);
    return { success: false, message: apiError.message, error: apiError.problemDetail };
  }
}
```

### 🎯 Built-in Error Handling

**@next-feature/client** provides:

- Custom `ApiError` class with status helpers
- Zod validation error extraction
- Spring Boot ProblemDetail structure support
- Error utility functions

```typescript
// Convert Zod validation errors automatically
if (!parsed.success) {
  const apiError = ApiError.fromZodError(parsed.error);
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
- ✓ Server action
- ✓ TypeScript types
- ✓ Constants
- ✓ Mapper utility

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
- **[clients/client/README.md](./clients/client/README.md)** - API client library features
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

# Edit lib/client/config.ts to add:
# - Authentication interceptors
# - Custom error handling
# - Request/response logging
# - Retry logic
```

## Architecture

### Generator Categories

**code/** - Individual code elements
- `api` - API calls and server actions
- `component` - React components
- `store` - State management
- `types` - Type definitions
- `constant` - Constants
- `utility` - Utility functions

**project/** - Complete projects
- `feature` - Feature libraries with setup
- `application` - Next.js applications
- `client` - API client libraries

**misc/** - Infrastructure setup
- `client-config` - Centralized API configuration
- `auth` - Authentication setup
- `axios` - HTTP client configuration
- `database` - Database setup

**tool/** - Workspace utilities
- `copy-deps` - Dependency management

## Version History

### v0.1.0 (Current)

✨ **Major Features:**

- **Client-Config Generator** - Auto-invoked by action generator
- **Zod Validation Errors** - Proper error extraction for form validation
- **Custom Client Support** - Use any client package with actions
- **Self-Contained Templates** - Stable, independent implementations
- **Comprehensive Documentation** - Detailed README files for all generators

🔧 **Improvements:**

- Centralized API client setup
- Eliminated boilerplate code duplication
- Enhanced error handling with `ApiError.fromZodError()`
- Template re-exports from local implementations
- Clear customization patterns

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

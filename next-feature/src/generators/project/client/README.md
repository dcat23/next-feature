# Client Generator

Generates a client library package that provides centralized API client utilities.

## Purpose

The client generator creates an Nx library package with:
- **ApiClient** - Axios wrapper with JWT/refresh token handling, retries, and interceptors
- **ApiError** - Custom error class for standardized error handling
- **Utility functions** - Error handling, formatting, and validation utilities
- **React hooks** - `useApiError` for error state management
- **Error boundary** - React error boundary component for API errors
- **TypeScript types** - Shared type definitions for API responses

## Usage

### Generate a Client Library

```bash
# Create a client package
npx nx g next-feature:client --name=myClient

# Create with scoped organization
npx nx g next-feature:client --name=myClient --orgName=myorg
```

### With Project Name

```bash
npx nx g next-feature:client --name=myClient --directory=clients
```

## Generated Structure

```
clients/myclient/
├── src/
│   ├── lib/
│   │   ├── client.ts           # ApiClient implementation
│   │   ├── error.ts            # ApiError class and builder
│   │   ├── types/
│   │   │   └── index.ts        # Type definitions
│   │   └── utils/
│   │       ├── error.ts        # Error utility functions
│   │       └── helper.ts       # Helper utilities
│   ├── hooks/
│   │   └── use-api-error.tsx   # React hook for error handling
│   ├── components/
│   │   └── api-error-boundary.tsx # Error boundary component
│   ├── index.ts                # Package exports
│   └── README.md               # Generated package documentation
├── package.json
├── tsconfig.json
├── project.json
└── .eslintrc.json
```

## Generated File Documentation

### `src/lib/client.ts`
Implements the `ApiClient` class with:
- **JWT/Refresh token handling** - Automatic token refresh with pending request queue
- **Retry logic** - Exponential backoff for failed requests
- **Request/response interceptors** - Hooks for cross-cutting concerns
- **HTTP methods** - `get`, `post`, `put`, `patch`, `delete`

**Customization:**
```typescript
// Add custom interceptor
const client = new ApiClient({ baseURL: '...' });
client.getAxiosInstance().interceptors.request.use((config) => {
  // Your custom logic
  return config;
});
```

### `src/lib/error.ts`
Implements the `ApiError` class with:
- **Spring Boot ProblemDetail** - Compatible with Spring Boot error responses
- **Status helpers** - `isClientError`, `isServerError`, `isUnauthorized`, etc.
- **Builder pattern** - Fluent API for creating errors
- **Zod validation** - `ApiError.fromZodError()` for form validation errors

**Static methods:**
- `ApiError.builder()` - Create custom errors
- `ApiError.of(error)` - Convert any error to ApiError
- `ApiError.fromZodError(zodError)` - Convert Zod validation errors

### `src/lib/types/index.ts`
Exports type definitions:
- `ApiResponse<T>` - Standard API response envelope
- `ProblemDetail` - Spring Boot error detail structure

### `src/lib/utils/error.ts`
Utility functions for error handling:
- `getErrorMessage(error)` - Extract user-friendly message
- `formatProblemDetail(error)` - Format error for display
- `isHttpStatus(error, status)` - Check error status
- `handleApiError(error)` - Global error handler
- `extractValidationErrors(error)` - Extract form validation errors

### `src/lib/utils/helper.ts`
General helper utilities (add as needed)

### `src/hooks/use-api-error.tsx`
React hook for managing API error state:
```typescript
const { error, setError, clearError } = useApiError();
```

### `src/components/api-error-boundary.tsx`
Error boundary component for catching API errors in React components

### `src/index.ts`
Main export barrel file. Re-exports all utilities for convenient imports:
```typescript
import { ApiClient, ApiError, useApiError } from '@myorg/myclient';
```

## How It Integrates

### With Action Generator

When you create an action, it automatically:
1. Detects if a client config exists
2. Creates `lib/client/config.ts` if missing (via `client-config` generator)
3. Imports utilities from your client package

**Example:**
```bash
npx nx g next-feature:action --name=getUser --projectName=myfeature
```

Generated action:
```typescript
import { type ApiResponse, ApiError } from "@next-feature/client"
import api from '../client/config';  // Auto-configured

export async function getUser(): Promise<ApiResponse<User>> {
  // ... uses the client
}
```

### With Client Config Generator

The client-config generator creates a configuration file that uses your generated client:

```bash
npx nx g next-feature:client-config --projectName=myfeature --clientPackage="@myorg/myclient"
```

This generates `lib/client/config.ts` that imports from your client package.

### With Other Generators

Once generated, any code generator can use it:

**API actions:**
```typescript
import { ApiError, type ApiResponse } from '@myorg/myclient';
```

**Components:**
```typescript
import { useApiError, ApiErrorBoundary } from '@myorg/myclient';
```

**Custom code:**
```typescript
import { ApiClient, getErrorMessage, extractValidationErrors } from '@myorg/myclient';
```

## Customization

### Modify Implementation

Edit any file directly - all exports flow through `src/index.ts`:

```bash
# Edit the ApiClient implementation
editor src/lib/client.ts

# Edit error handling
editor src/lib/error.ts

# Edit the React hook
editor src/hooks/use-api-error.tsx
```

### Add Custom Utilities

Extend `src/lib/utils/helper.ts` with project-specific utilities:

```typescript
// src/lib/utils/helper.ts
export function formatErrorForUI(error: ApiError): string {
  // Your custom formatting
  return error.message;
}
```

Then export from `src/index.ts`:
```typescript
export * from './lib/utils/helper';
```

### Replace Implementation

You can completely replace the generated implementation:

```typescript
// src/lib/client.ts - Replace with custom implementation
import { AxiosInstance } from 'axios';

export class ApiClient {
  // Your custom implementation
}
```

The exports in `src/index.ts` automatically use your new implementation.

## Common Patterns

### Pattern 1: Custom Axios Instance

```typescript
// src/lib/client.ts
const axiosInstance = axios.create({
  baseURL: process.env.API_URL,
  timeout: 30000,
  headers: {
    'X-Custom-Header': 'value'
  }
});

// In ApiClient constructor
this.instance = axiosInstance;
```

### Pattern 2: Add Bearer Token

```typescript
// src/lib/client.ts - In setupInterceptors()
this.instance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Pattern 3: Global Error Logging

```typescript
// src/lib/client.ts - In setupInterceptors()
this.instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status >= 500) {
      logErrorService.report(error);
    }
    return Promise.reject(error);
  }
);
```

### Pattern 4: Request Timeout

```typescript
// src/lib/client.ts - In ApiClient constructor
this.config = {
  timeout: 15000,  // 15 seconds
  // ... other config
};
```

### Pattern 5: Custom Error Handling Hook

```typescript
// src/hooks/use-custom-api-error.tsx
'use client';

import { ApiError } from '../lib/error';

export function useCustomApiError() {
  const handleError = (error: ApiError) => {
    if (error.isUnauthorized) {
      // Redirect to login
    } else if (error.isServerError) {
      // Show maintenance message
    }
  };

  return { handleError };
}
```

## Publishing

The generated client is a complete Nx library that can be:

1. **Used internally** in other projects in the monorepo
2. **Published to npm** for external use

Publish via Nx release or npm:

```bash
npm publish
```

## Testing

Add tests alongside your generated files:

```
src/
├── lib/
│   ├── client.ts
│   ├── client.spec.ts       # Add tests
│   ├── error.ts
│   └── error.spec.ts        # Add tests
└── ...
```

Run tests:

```bash
npx nx test @myorg/myclient
```

## Version Management

The generated package has its own:
- `package.json` - Version and dependencies
- `tsconfig.json` - TypeScript configuration
- `project.json` - Nx project configuration

Update versions independently from your main app.

## Troubleshooting

### ApiClient not intercepting requests

Ensure you're calling `getAxiosInstance()` to access the underlying Axios instance:

```typescript
const instance = apiClient.getAxiosInstance();
instance.interceptors.request.use(...);
```

### Circular dependencies

Keep client imports clean - only import types and interfaces from action/component files.

### Type mismatches

Ensure your `ProblemDetail` matches your backend's error response structure. Customize `src/lib/types/index.ts` as needed.

## Related Generators

- **action** - Create server actions that use this client
- **client-config** - Create centralized client configuration
- **component** - Create React components that use error hooks
- **store** - Create Zustand stores that interact with the client

## See Also

- [Action Generator Documentation](../code/action/README.md)
- [Client Config Generator Documentation](../misc/client-config/README.md)

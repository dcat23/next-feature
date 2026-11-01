# Client Configuration Template Files

This directory contains templates for the centralized client configuration.

## Generated File

When the client-config generator runs, it creates:

```
src/lib/client/
└── config.ts          # Centralized API client configuration (generated)
```

## Template Variables

The `config.ts__tmpl__` template supports these variables:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `clientImportPath` | string | `@next-feature/client` | Where to import ApiClient and utilities from |
| `baseUrl` | string | `process.env.NEXT_PUBLIC_API_URL` | API base URL expression |
| `includeInterceptors` | boolean | `true` | Include example interceptor code comments |

## Configuration Details

### Base URL Configuration

The config supports dynamic base URL:

```typescript
// Using environment variable (default)
const baseURL = process.env.NEXT_PUBLIC_API_URL;

// Using hardcoded value
const baseURL = 'https://api.example.com';

// Using dynamic logic
const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://api.prod.example.com'
  : 'http://localhost:3000/api';
```

### Client Import Path

Specify where to import API utilities from. Client-safe exports (`ApiError`, `ApiResponse`) come from the package root; the server-only `ApiClient` comes from its `/server` entry:

```typescript
// Default - uses published @next-feature/client
import { type ApiResponse, ApiError } from '@next-feature/client';
import { ApiClient } from '@next-feature/client/server';

// Custom - uses project-specific client package
import { type ApiResponse, ApiError } from '@myorg/http-client';
import { ApiClient } from '@myorg/http-client/server';

// Local - uses generated client package
import { type ApiResponse, ApiError } from '@myfeature/client';
import { ApiClient } from '@myfeature/client/server';
```

### Interceptor Examples

When `includeInterceptors: true`, the template includes commented examples:

```typescript
/**
 * Example: Add custom request interceptor
 */
// apiClient.interceptors.request.use((config) => {
//   // Add custom headers, auth tokens, etc.
//   return config;
// });

/**
 * Example: Add custom response interceptor
 */
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Handle errors globally
//     return Promise.reject(error);
//   }
// );
```

## How to Customize

### 1. Regenerate with Different Options

```bash
# Clear the existing config
rm src/lib/config/client.ts

# Regenerate with custom settings
npx nx g next-feature:client-config --projectName=myfeature \
  --baseUrl="'https://api.custom.com'" \
  --includeInterceptors=false
```

### 2. Edit the Generated File Directly

After generation, you can edit `src/lib/config/client.ts` directly:

```typescript
// src/lib/config/client.ts

const apiClient = new ApiClient({
  baseURL,
  timeout: 30000,
  // Add custom config
});

// Add your custom interceptors
apiClient.axios.interceptors.request.use((config) => {
  // Add auth token from cookie or session
  const token = getCookie('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Common Patterns

### Pattern 1: Authentication with JWT

```typescript
// src/lib/config/client.ts
import { getToken } from './auth';

apiClient.axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Pattern 2: Global Error Handler

`lib/config/client.ts` is server-only, so it can't touch `window`. Use the `ApiClient` hooks, and let the client component react to the returned `ProblemDetail` (e.g. `ApiError.of(response.error).isUnauthorized`).

```typescript
// src/lib/config/client.ts
const apiClient = new ApiClient({
  baseURL,
  onUnauthorized: async () => {
    // 401 after a failed token refresh: clear the session, log, ...
  },
});
```

### Pattern 3: Request Logging

```typescript
// src/lib/config/client.ts
apiClient.axios.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

apiClient.axios.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API] Error:`, error.message);
    return Promise.reject(error);
  }
);
```

### Pattern 4: Request Timeout Handling

```typescript
// src/lib/config/client.ts
const apiClient = new ApiClient({
  baseURL,
  timeout: 30000,  // 30 seconds
});

apiClient.axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    return Promise.reject(error);
  }
);
```

## Using in Server Actions

Once configured, use it in your server actions:

```typescript
// src/lib/actions/user.ts
import 'server-only';

import { type ApiResponse, ApiError } from "@next-feature/client"
import api from '../config/client';

export async function getUser(id: string): Promise<ApiResponse<User>> {
  try {
    const user = await api.get<User>(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    const apiError = ApiError.of(error);
    return {
      success: false,
      message: apiError.message,
      error: apiError.problemDetail
    };
  }
}
```

> Actions are `server-only`: call them from server components, route handlers or other server code. Client components go through a `'use server'` wrapper (`<file>.action.ts`, generated with `--useHook`) or a form action (`<file>.form.ts`, generated with `--actionType=form`).

## Re-exporting Utilities

The config file re-exports commonly used utilities:

```typescript
// Available to import from anywhere
import { ApiError, type ApiResponse } from "@next-feature/client"
import { getErrorMessage, isHttpStatus, isProblemDetail } from "@next-feature/client"
```

You can extend the re-exports:

```typescript
// src/lib/config/client.ts

// Re-export everything from @next-feature/client
export * from "@next-feature/client"

// Add project-specific utilities
export function createApiError(message: string) {
  return ApiError.builder()
    .message(message)
    .status(400)
    .build();
}
```

## When This File is Generated

The client config is automatically generated by the **action generator** when:

1. You run: `npx nx g next-feature:action --projectName=myfeature`
2. The action generator checks if `lib/config/client.ts` exists
3. If missing, it creates one automatically with:
   - Base URL from `process.env.NEXT_PUBLIC_API_URL`
   - Default interceptor setup (commented examples)
   - All utility re-exports

## Disabling Auto-generation

To prevent auto-generation when creating an action:

1. Create the file manually first:
   ```bash
   mkdir -p src/lib/client
   # Add your custom config.ts
   ```

2. Or run the generator with `--projectName` set to a project that already has the config

## Tips

- **Keep it simple**: Don't put too much logic in the config file
- **Separate concerns**: Use separate utility files for complex interceptor logic
- **Test interceptors**: Test your interceptors with the ApiClient directly
- **Version control**: Commit your custom config.ts to track changes
- **Documentation**: Add JSDoc comments to custom functions in config.ts

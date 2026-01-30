# Client Config Generator

Generates a centralized client configuration file (`lib/client/config.ts`) for your project.

## Purpose

The client config file provides a single point to manage:
- **Base API URL** configuration
- **Request/response interceptors** for cross-cutting concerns
- **Default HTTP headers** and authentication
- **Error handling** and retry logic customization
- **Re-exports** of commonly used API utilities

## Usage

### Automatic Generation

The **action generator automatically creates this config** if it doesn't already exist:

```bash
npx nx g next-feature:action --name=getUsers --projectName=myfeature
```

This will:
1. Create `lib/client/config.ts` with default setup
2. Generate your action file that imports from this config
3. Allow you to customize the config later

### Manual Generation

Generate a config explicitly:

```bash
npx nx g next-feature:client-config --projectName=myfeature
npx nx g next-feature:client-config --projectName=myfeature --includeInterceptors=true
```

## Generated File Structure

```
src/
├── lib/client/
│   └── config.ts          # Your centralized client configuration
└── [other files]
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectName` | string | required | The project where config will be generated |
| `clientPackage` | string | `@next-feature/client` | Client package to import from |
| `baseUrl` | string | `process.env.NEXT_PUBLIC_API_URL` | Base URL for API requests |
| `includeInterceptors` | boolean | `true` | Include example interceptor setup |
| `skipFormat` | boolean | `false` | Skip prettier formatting |

## Customization Examples

### Example 1: Custom Base URL

```bash
npx nx g next-feature:client-config --projectName=myfeature --baseUrl="'https://api.example.com'"
```

### Example 2: Use Custom Client Package

```bash
npx nx g next-feature:client-config --projectName=myfeature --clientPackage="@myorg/http-client"
```

### Example 3: Without Interceptor Comments

```bash
npx nx g next-feature:client-config --projectName=myfeature --includeInterceptors=false
```

## Generated Config File

The generated `lib/client/config.ts` looks like:

```typescript
import { ApiClient, type ApiResponse, ApiError } from '@next-feature/client';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = new ApiClient({
  baseURL,
  // Add other config options here
});

// Re-export commonly used utilities
export { ApiError, type ApiResponse };
export { getErrorMessage, formatProblemDetail, extractValidationErrors } from '@next-feature/client';

export default apiClient;
```

## How to Use in Actions

Once generated, import the config in your server actions:

```typescript
// src/lib/actions/get-users-api.ts
'use server';

import { type ApiResponse, ApiError } from "@next-feature/client"
import api from '../client/config';  // Import from your config

export async function getUsers(): Promise<ApiResponse<User[]>> {
  try {
    const response = await api.get<User[]>('/users');
    return { success: true, data: response };
  } catch (error) {
    const apiError = ApiError.of(error);
    return { success: false, error: apiError.problemDetail, message: apiError.message };
  }
}
```

## Customizing the Config

### Add Request Interceptor

```typescript
// src/lib/client/config.ts
apiClient.getAxiosInstance().interceptors.request.use((config) => {
  // Add auth token
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Add Response Interceptor

```typescript
// src/lib/client/config.ts
apiClient.getAxiosInstance().interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors globally
    if (error.response?.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

### Custom Error Handling

```typescript
// src/lib/client/config.ts
apiClient.getAxiosInstance().interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = ApiError.of(error);

    if (apiError.isUnauthorized) {
      // Handle unauthorized
      redirectToLogin();
    } else if (apiError.isServerError) {
      // Log to error tracking service
      logError(apiError);
    }

    return Promise.reject(error);
  }
);
```

## Integration with Action Generator

When you create an action, it automatically:
1. Checks if `lib/client/config.ts` exists
2. Creates it if missing (using default settings)
3. Imports the config in your action file
4. Uses the configured API client

Example:

```bash
# First action in a project
npx nx g next-feature:action --name=fetchUserProfile --projectName=myfeature

# Output:
# CREATE apps/myfeature/src/lib/client/config.ts (with defaults)
# CREATE apps/myfeature/src/lib/actions/fetch-user-profile-api.ts
```

## When to Use Client Config vs Custom Client Package

| Use Case | Recommendation |
|----------|---|
| Simple API setup with interceptors | Use client-config generator |
| Base URL and auth token handling | Use client-config generator |
| Custom ApiClient/ApiError classes | Generate a custom client package |
| Multiple clients per project | Generate multiple client packages |
| Shared client across projects | Create a custom client package |

## Files Modified

The generator only creates:
- `src/lib/client/config.ts`

It does not modify:
- Your action files
- Your project configuration
- Package dependencies

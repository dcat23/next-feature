# @next-feature/client v0.1.0

Complete API client library with built-in error handling, validation support, and React utilities for Next.js applications.

## Overview

**@next-feature/client** provides a production-ready API client with:

- **ApiClient** - Axios wrapper with JWT/refresh token handling and retry logic
- **ApiError** - Custom error class with status helpers and validation support
- **Error Utilities** - Formatting, extraction, and handling functions
- **React Hooks** - `useApiError` for error state management
- **Error Boundary** - React component for error handling
- **Type Definitions** - Full TypeScript support

## Quick Start

### Installation

```bash
npm install @next-feature/client
```

### Basic Usage

```typescript
import { ApiClient, ApiError, type ApiResponse } from '@next-feature/client';

// Create client
const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Use in server actions
export async function getUser(id: string): Promise<ApiResponse<User>> {
  try {
    const user = await apiClient.get<User>(`/users/${id}`);
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

## Features

### 🔐 Token Management

Automatic JWT/refresh token handling with pending request queue:

```typescript
const apiClient = new ApiClient({
  baseURL: 'https://api.example.com',
  enableRefreshToken: true,
  onRefreshToken: async () => {
    const response = await fetch('/api/refresh');
    return (await response.json()).token;
  },
  onUnauthorized: async () => {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

### 🔄 Retry Logic

Automatic retry with exponential backoff:

```typescript
const apiClient = new ApiClient({
  baseURL: 'https://api.example.com',
  maxRetries: 3,      // Retry up to 3 times
  retryDelay: 1000    // Start with 1 second delay
});

// Automatically retries on:
// - Network errors
// - 5xx server errors
// - 429 (Too Many Requests)
```

### 🎯 Error Handling

Custom `ApiError` class with helpers:

```typescript
import { ApiError } from '@next-feature/client';

try {
  await apiClient.get('/users');
} catch (error) {
  const apiError = ApiError.of(error);

  if (apiError.isUnauthorized) {
    // Handle 401 Unauthorized
  } else if (apiError.isServerError) {
    // Handle 5xx
  } else if (apiError.isNotFound) {
    // Handle 404
  }

  console.error(apiError.message);
  console.error(apiError.problemDetail);
}
```

### ✓ Zod Validation Errors

Convert form validation errors automatically:

```typescript
import { z } from 'zod';
import { ApiError } from '@next-feature/client';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const result = schema.safeParse(formData);

if (!result.success) {
  // Convert Zod errors to ApiError with validation details
  const apiError = ApiError.fromZodError(result.error);

  // apiError.problemDetail.errors:
  // { 'email': ['Invalid email'], 'password': ['Too short'] }
}
```

### 🎨 Spring Boot Integration

Compatible with Spring Boot `ProblemDetail` error responses:

```typescript
// Backend returns:
{
  "type": "https://example.com/probs/invalid-request",
  "title": "Invalid Request",
  "status": 400,
  "detail": "The request contained invalid data",
  "errors": {
    "email": ["Invalid email format"]
  }
}

// Automatically parsed into:
const apiError = ApiError.of(error);
console.log(apiError.problemDetail.errors);  // { email: ['Invalid...'] }
```

## HTTP Methods

```typescript
// GET
const data = await apiClient.get<T>('/endpoint');

// POST
const data = await apiClient.post<T>('/endpoint', { body });

// PUT
const data = await apiClient.put<T>('/endpoint', { body });

// PATCH
const data = await apiClient.patch<T>('/endpoint', { body });

// DELETE
const data = await apiClient.delete<T>('/endpoint');
```

## Interceptors

```typescript
const apiClient = new ApiClient({ baseURL: '...' });

// Request interceptor
apiClient.getAxiosInstance().interceptors.request.use((config) => {
  // Add custom headers
  config.headers['X-Custom-Header'] = 'value';
  return config;
});

// Response interceptor
apiClient.getAxiosInstance().interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    console.error(error);
    return Promise.reject(error);
  }
);
```

## Error Utilities

### getErrorMessage()

Extract user-friendly error message:

```typescript
import { getErrorMessage } from '@next-feature/client';

const message = getErrorMessage(error);
toast.error(message);
```

### formatProblemDetail()

Format error for display:

```typescript
import { formatProblemDetail } from '@next-feature/client';

const formatted = formatProblemDetail(apiError);
console.log(formatted);
```

### isHttpStatus()

Check specific HTTP status:

```typescript
import { isHttpStatus } from '@next-feature/client';

if (isHttpStatus(error, 401)) {
  redirectToLogin();
}
```

### handleApiError()

Global error handler:

```typescript
import { handleApiError } from '@next-feature/client';

try {
  await apiClient.get('/data');
} catch (error) {
  handleApiError(error);  // Logs appropriate messages
}
```

### extractValidationErrors()

Extract form field errors:

```typescript
import { extractValidationErrors } from '@next-feature/client';

const fieldErrors = extractValidationErrors(apiError);
// { email: ['Invalid email'], password: ['Too short'] }

// Use with forms
Object.entries(fieldErrors).forEach(([field, messages]) => {
  showFieldError(field, messages[0]);
});
```

## React Integration

### useApiError Hook

Manage API error state in components:

```typescript
'use client';

import { useApiError } from '@next-feature/client';

export function MyComponent() {
  const { error, setError, clearError } = useApiError();

  const handleSubmit = async (data) => {
    try {
      const result = await myAction(data);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError(ApiError.of(err));
    }
  };

  return (
    <>
      {error && (
        <div className="error-alert">
          <p>{error.message}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      {/* Form JSX */}
    </>
  );
}
```

### ApiErrorBoundary Component

Error boundary for API errors:

```typescript
import { ApiErrorBoundary } from '@next-feature/client';

export function App() {
  return (
    <ApiErrorBoundary
      fallback={(error, reset) => (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <YourContent />
    </ApiErrorBoundary>
  );
}
```

## Type Definitions

### ApiResponse<T>

Standard API response envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ProblemDetail | null;
  message?: string;
}
```

### ProblemDetail

Error detail structure:

```typescript
interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, unknown>;
  [key: string]: unknown;
}
```

### ApiClientConfig

Client configuration:

```typescript
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;                          // Default: 30000ms
  enableRefreshToken?: boolean;              // Default: true
  maxRetries?: number;                       // Default: 3
  retryDelay?: number;                       // Default: 1000ms
  onAuthenticated?: (config) => void | Promise<void>;
  onUnauthorized?: () => void | Promise<void>;
  onRefreshTokenExpired?: () => void | Promise<void>;
  onRefreshToken?: () => string | Promise<string>;
}
```

## Integration with next-feature

This library is designed to work seamlessly with the **next-feature generator plugin**:

```bash
# Actions automatically import from this library
npx nx g next-feature:action --name=getUser --projectName=myapp

# Generated action will use:
import { ApiError, type ApiResponse } from '@next-feature/client';
```

Generated client configurations use this library:

```bash
# Client-config generator creates lib/client/config.ts
npx nx g next-feature:client-config --projectName=myapp

# Which imports and uses:
import { ApiClient, ApiError } from '@next-feature/client';
```

## Testing

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Examples

### Form Submission with Validation

```typescript
'use server';

import { z } from 'zod';
import { ApiError, type ApiResponse } from '@next-feature/client';
import apiClient from './config';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function loginAction(
  formData: FormData
): Promise<ApiResponse<{ token: string }>> {
  const email = formData.get('email');
  const password = formData.get('password');

  const result = schema.safeParse({ email, password });

  if (!result.success) {
    const apiError = ApiError.fromZodError(result.error);
    return {
      success: false,
      message: apiError.message,
      error: apiError.problemDetail
    };
  }

  try {
    const token = await apiClient.post<{ token: string }>('/auth/login', result.data);
    return { success: true, data: token };
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

### API Data Fetching

```typescript
export async function getProduct(id: string): Promise<ApiResponse<Product>> {
  try {
    const product = await apiClient.get<Product>(`/products/${id}`);
    return { success: true, data: product };
  } catch (error) {
    const apiError = ApiError.of(error);
    return {
      success: false,
      message: `Failed to fetch product: ${apiError.message}`,
      error: apiError.problemDetail
    };
  }
}
```

## Troubleshooting

### Request not retried

Check `enableRefreshToken` and `maxRetries` configuration.

### Token not refreshed

Ensure `onRefreshToken` is implemented and returns valid token string.

### Type mismatches

Ensure your `ProblemDetail` shape matches your backend error responses.

## License

MIT

## See Also

- [next-feature Plugin](../../next-feature/README.md) - Generator plugin using this library
- [NextFeature](../../README.md) - Complete ecosystem overview

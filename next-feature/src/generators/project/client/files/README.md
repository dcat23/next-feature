# Client Template Files

This directory contains the template files generated for the client library package.

## File Structure

```
src/
├── lib/
│   ├── client.ts           # ApiClient implementation (Axios wrapper)
│   ├── error.ts            # ApiError class and builder
│   ├── types/
│   │   └── index.ts        # Type definitions
│   └── utils/
│       ├── error.ts        # Error utility functions
│       └── helper.ts       # Helper utilities
├── hooks/
│   └── use-api-error.tsx   # React hook for error state
├── components/
│   └── api-error-boundary.tsx # Error boundary component
└── index.ts                # Main export barrel file
```

## Key Files

### `src/lib/client.ts`

**Purpose:** Implements the `ApiClient` class - an Axios wrapper with advanced features.

**Key Features:**
- JWT/Bearer token handling and refresh
- Automatic token refresh with pending request queue
- Retry logic with exponential backoff
- Request/response interceptor setup
- HTTP methods: `get`, `post`, `put`, `patch`, `delete`

**Configuration Options:**
```typescript
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;           // Default: 30000ms
  enableRefreshToken?: boolean; // Default: true
  maxRetries?: number;        // Default: 3
  retryDelay?: number;        // Default: 1000ms
  onAuthenticated?: (config) => void;
  onUnauthorized?: () => void;
  onRefreshTokenExpired?: () => void;
  onRefreshToken?: () => string | Promise<string>;
}
```

**Customization Examples:**

```typescript
// Custom base URL
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  timeout: 60000
});

// Custom refresh token handler
const client = new ApiClient({
  baseURL,
  onRefreshToken: async () => {
    const response = await fetch('/api/auth/refresh');
    return response.json().token;
  }
});

// Custom unauthorized handler
const client = new ApiClient({
  baseURL,
  onUnauthorized: async () => {
    window.location.href = '/login';
  }
});
```

### `src/lib/error.ts`

**Purpose:** Implements the `ApiError` class and builder for standardized error handling.

**Features:**
- Spring Boot `ProblemDetail` structure support
- Helper getters: `isClientError`, `isServerError`, `isUnauthorized`, `isForbidden`, `isNotFound`
- Fluent builder pattern: `ApiError.builder()`
- Static conversion methods:
  - `ApiError.of(error)` - Convert any error
  - `ApiError.fromZodError(zodError)` - Convert Zod validation errors

**Usage Examples:**

```typescript
// Convert any error
const apiError = ApiError.of(caughtError);
console.log(apiError.message);
console.log(apiError.status);

// Build custom error
const customError = ApiError.builder()
  .status(400)
  .message('Bad Request')
  .problemDetail('errors', { field: 'Invalid value' })
  .build();

// Handle Zod validation errors
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });
const result = schema.safeParse(data);

if (!result.success) {
  const apiError = ApiError.fromZodError(result.error);
  // apiError.problemDetail.errors = { 'email': 'Invalid email' }
}
```

### `src/lib/types/index.ts`

**Purpose:** Defines TypeScript types used throughout the client.

**Key Types:**

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ProblemDetail | null;
  message?: string;
}

interface ProblemDetail {
  type: string;
  title: string;
  status: HttpStatusCode;
  detail?: string;
  instance?: string;
  errors?: Record<string, unknown>;
  [key: string]: unknown;
}
```

**Customization:**
Add project-specific types:

```typescript
// src/lib/types/index.ts
export interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  timestamp: string;
  // ... your custom error fields
}
```

### `src/lib/utils/error.ts`

**Purpose:** Utility functions for error handling and formatting.

**Available Functions:**

```typescript
// Get user-friendly error message
getErrorMessage(error: unknown): string

// Format error for display
formatProblemDetail(error: ApiError): string

// Check HTTP status
isHttpStatus(error: unknown, status: number): boolean

// Global error handler
handleApiError(error: unknown): void

// Extract validation errors
extractValidationErrors(error: ApiError): Record<string, string[]> | null
```

**Usage Examples:**

```typescript
// Extract validation errors from form submission
const apiError = ApiError.fromZodError(zodError);
const validationErrors = extractValidationErrors(apiError);
// { email: ['Invalid email'], password: ['Too short'] }

// Display error to user
const message = getErrorMessage(error);
toast.error(message);

// Check specific error type
if (isHttpStatus(error, 401)) {
  redirectToLogin();
}
```

### `src/lib/utils/helper.ts`

**Purpose:** General helper utilities (add project-specific helpers here).

**Customization:**
```typescript
// src/lib/utils/helper.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  }) as T;
}
```

### `src/hooks/use-api-error.tsx`

**Purpose:** React hook for managing API error state in components.

**Signature:**
```typescript
function useApiError() {
  const [error, setError] = useState<ApiError | null>(null);
  const clearError = () => setError(null);

  return { error, setError, clearError };
}
```

**Usage in Components:**
```typescript
'use client';

import { useApiError } from '@myorg/myclient';

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
        <div className="error">
          {error.message}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      {/* ... form JSX ... */}
    </>
  );
}
```

### `src/components/api-error-boundary.tsx`

**Purpose:** React error boundary component that catches API errors.

**Signature:**
```typescript
interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: ApiError, reset: () => void) => React.ReactNode;
}

export function ApiErrorBoundary({ children, fallback }: ApiErrorBoundaryProps)
```

**Usage in Components:**
```typescript
import { ApiErrorBoundary } from '@myorg/myclient';

export function App() {
  return (
    <ApiErrorBoundary
      fallback={(error, reset) => (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <MyPage />
    </ApiErrorBoundary>
  );
}
```

### `src/index.ts`

**Purpose:** Main export barrel file that re-exports all public APIs.

**Exports:**
```typescript
// Core API client
export { ApiClient, type ApiClientConfig } from "./lib/client"

// Error handling
export { ApiError, ApiErrorBuilder, type ProblemDetail } from "./lib/error"

// Types
export * from "./lib/types"

// Utilities
export * from "./lib/utils/error"
export * from "./lib/utils/helper"
```

**Customization:**
Add selective exports:
```typescript
// src/index.ts

// Only export what you need
export { ApiClient } from './lib/client';
export { ApiError } from './lib/error';
export { useApiError } from './hooks/use-api-error';

// Don't export internal utilities (keep them private)
// export * from './lib/utils/error';
```

## Integration with Generators

### With Action Generator

When creating actions, they automatically import from your client:

```bash
npx nx g next-feature:action --name=getUser --actionType=api --projectName=myapp
```

Generated action uses your client:
```typescript
import { type ApiResponse, ApiError } from "@next-feature/client"

export async function getUser(id: string): Promise<ApiResponse<User>> {
  // ... uses ApiError, ApiResponse from your client
}
```

### With Client Config Generator

Create centralized configuration:

```bash
npx nx g next-feature:client-config --projectName=myapp
```

Generated config imports from your client:
```typescript
import { ApiClient, type ApiResponse, ApiError } from '@myorg/myclient';

const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

export { ApiError, type ApiResponse };
export default apiClient;
```

## Customization Workflow

### Scenario 1: Add Custom Error Handling

1. Edit `src/lib/error.ts`
2. Add custom error class:
   ```typescript
   export class ValidationError extends ApiError {
     // ...
   }
   ```
3. Export from `src/index.ts`
4. Use in actions and components

### Scenario 2: Add Custom Request Header

1. Edit `src/lib/client.ts`
2. In `setupInterceptors()`:
   ```typescript
   this.instance.interceptors.request.use((config) => {
     config.headers['X-Client-Version'] = '1.0.0';
     return config;
   });
   ```

### Scenario 3: Add Bearer Token Authentication

1. Edit `src/lib/client.ts`
2. Add to request interceptor:
   ```typescript
   const token = getStoredToken();
   if (token) {
     config.headers.Authorization = `Bearer ${token}`;
   }
   ```

### Scenario 4: Add Form Validation Utilities

1. Extend `src/lib/utils/helper.ts`:
   ```typescript
   export function validateEmail(email: string): boolean {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   }
   ```
2. Export from `src/index.ts`
3. Use in components and actions

## Best Practices

1. **Keep client independent** - Don't import from other packages
2. **Use TypeScript** - Leverage types for safety
3. **Document custom additions** - Add JSDoc comments
4. **Test interceptors** - Verify your custom logic works
5. **Version your client** - Update package.json version when making breaking changes
6. **Export barrel file** - Use `src/index.ts` for all public APIs
7. **Separate concerns** - Keep client setup, error handling, and utilities in separate files

## Files Not to Edit

These files are auto-generated and should not be manually edited:
- `package.json` - Update via `npx nx generate`
- `tsconfig.json` - Update via Nx configuration
- `project.json` - Update via Nx configuration
- `.eslintrc.json` - Update via Nx configuration

## Testing Your Client

Create test files alongside implementations:

```typescript
// src/lib/client.spec.ts
import { ApiClient } from './client';

describe('ApiClient', () => {
  it('should create instance with config', () => {
    const client = new ApiClient({ baseURL: 'http://test' });
    expect(client).toBeDefined();
  });

  it('should handle 401 errors', async () => {
    // ... test token refresh
  });
});
```

## See Also

- [Client Generator Documentation](../README.md)
- [Action Generator Documentation](../../code/action/README.md)
- [Client Config Generator Documentation](../../misc/client-config/README.md)

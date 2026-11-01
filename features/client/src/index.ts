/**
 * Client package exports (client-safe)
 *
 * This entry point is safe to import from client and server components:
 * ApiError, response/error types, error helpers, and the 'use client'
 * ApiErrorBoundary / useApiError (kept as client modules in the build).
 * Server-only code lives in
 * './server' (import from '<package>/server'):
 *   - ApiClient (reads server env, used by lib/config/client.ts)
 *   - withApi / withForm (used by generated server actions)
 *
 * CUSTOMIZATION:
 * You can easily customize any part of the implementation:
 *
 * 1. For custom ApiClient/ApiError logic with interceptors:
 *    - Run: npx nx g next-feature:client-config --projectName=<your-project>
 *    - This creates lib/config/client.ts for centralized setup
 *
 * 2. For full custom implementations:
 *    - Edit src/lib/client.ts to customize ApiClient behavior
 *    - Edit src/lib/error.ts to customize error handling
 *    - The changes are immediately reflected in all imports
 *
 * 3. For project-specific hooks/components:
 *    - Customize src/hooks/use-api-error.tsx
 *    - Customize src/components/api-error-boundary.tsx
 */

// Core API utilities
export { ApiError } from './lib/error';

// Client components and hooks: kept as 'use client' modules in the build,
// so server components can import them from this entry too
export { ApiErrorBoundary } from './components/api-error-boundary';
export { useApiError } from './hooks/use-api-error';

export * from './lib/types/client';
export * from './lib/types/index';
export * from './lib/utils/axios';
export * from './lib/utils/error';
export * from './lib/utils/problem-detail';
export * from './lib/utils/zod';

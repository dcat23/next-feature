/**
 * Client package exports (client-safe)
 *
 * This entry point is safe to import from client components: ApiError,
 * response/error types and error helpers. Server-only code lives in
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
 *    - Import directly: import { useApiError } from './hooks/use-api-error'
 *    - Customize src/hooks/use-api-error.tsx
 *    - Customize src/components/api-error-boundary.tsx
 */

// Core API utilities
export { ApiError } from './lib/error';

export * from './lib/types/client';
export * from './lib/types/index';
export * from './lib/utils/axios';
export * from './lib/utils/error';
export * from './lib/utils/zod';

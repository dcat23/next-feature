import { HttpStatusCode } from 'axios';
import { ApiError } from '../error';

/**
 * The parts of a ZodError this package relies on. Typed structurally so a
 * ZodError from the app's own zod (any copy, v3 or v4) is accepted.
 */
export interface ZodErrorLike extends Error {
  issues: { path: PropertyKey[]; message: string }[];
}

/**
 * Check for a ZodError by shape rather than `instanceof`, which fails when
 * the error comes from a different copy or major version of zod than this
 * package's.
 */
export function isZodError(error: unknown): error is ZodErrorLike {
  return (
    error instanceof Error &&
    error.name === 'ZodError' &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

/**
 * Key in `ProblemDetail.errors` for issues without a path, e.g. an
 * object-level `.refine()` such as "Passwords must match". Field issues are
 * keyed by their dotted path instead.
 */
export const FORM_ERROR_KEY = '_form';

/**
 * Create ApiError from Zod validation error
 *
 * [handle-zod-error]
 * next-feature@0.1.1-beta.5
 * January 11th 2026, 9:40:46 pm
 */
export function handleZodError(zodError: ZodErrorLike) {
  const errors: Record<string, string> = {};

  // `issues` exists in zod 3 and 4 (`errors` was removed in zod 4).
  // Keyed by the full dotted path (`address.city`, `tags.0`), matching the
  // form field names; issues without a path (object-level refinements) go
  // under FORM_ERROR_KEY so forms can still show them.
  zodError.issues.forEach((issue) => {
    const key = issue.path.length
      ? issue.path.map(String).join('.')
      : FORM_ERROR_KEY;
    errors[key] = issue.message;
  });

  return ApiError.builder()
    .originalError(zodError)
    .status(HttpStatusCode.BadRequest)
    .message('Validation Error')
    .errors(errors)
    .build();
}

import type { ProblemDetail } from '../types';

/**
 * Check whether a value has the Spring Boot ProblemDetail shape.
 *
 * Server actions return a plain ProblemDetail (not an ApiError instance,
 * which React cannot serialize to the client); use this, or ApiError.of(),
 * to recognise and rehydrate it.
 */
export function isProblemDetail(value: unknown): value is ProblemDetail {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'title' in value &&
    'status' in value
  );
}

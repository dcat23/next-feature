import { ApiError } from '../error';

/**
 * Extract user-friendly error message from ApiError
 *
 * [get-error-message]
 * next-feature@0.0.11-beta
 * November 4th 2025, 11:47:45 am
 *
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Use Spring Boot ProblemDetail information
    if (error.problemDetail?.detail) {
      return error.problemDetail.detail;
    }
    if (error.problemDetail?.title) {
      return error.problemDetail.title;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Format ProblemDetail for display
 */
export function formatProblemDetail(error: ApiError): string {
  if (!error.problemDetail) {
    return error.message;
  }

  const parts: string[] = [];

  if (error.problemDetail.title) {
    parts.push(`Title: ${error.problemDetail.title}`);
  }

  if (error.problemDetail.detail) {
    parts.push(`Detail: ${error.problemDetail.detail}`);
  }

  if (error.problemDetail.instance) {
    parts.push(`Instance: ${error.problemDetail.instance}`);
  }

  return parts.join('\n');
}

/**
 * Check if error is a specific HTTP status
 */
export function isHttpStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

/**
 * Handle common API errors
 */
export function handleApiError(error: unknown): void {
  if (!(error instanceof ApiError)) {
    console.error('Unexpected error:', error);
    return;
  }

  switch (error.status) {
    case 400:
      console.error('Bad Request:', error.problemDetail?.detail);
      break;
    case 401:
      console.error('Unauthorized - Please login');
      break;
    case 403:
      console.error('Forbidden - Access denied');
      break;
    case 404:
      console.error('Not Found:', error.problemDetail?.detail);
      break;
    case 409:
      console.error('Conflict:', error.problemDetail?.detail);
      break;
    case 422:
      console.error('Validation Error:', error.problemDetail);
      break;
    case 429:
      console.error('Too Many Requests - Please slow down');
      break;
    case 500:
      console.error('Server Error:', error.problemDetail?.detail);
      break;
    case 503:
      console.error('Service Unavailable - Please try again later');
      break;
    default:
      console.error(`Error ${error.status}:`, error.message);
  }
}

/**
 * Validation error extractor for Spring Boot validation errors
 */
export function extractValidationErrors(
  error: ApiError
): Record<string, string[]> | null {
  if (!error.problemDetail || error.status !== 400) {
    return null;
  }

  // Spring Boot often includes validation errors in a 'errors' or 'fieldErrors' property
  const errors = error.problemDetail.errors || error.problemDetail.fieldErrors;

  if (!errors) {
    return null;
  }

  // Convert to a more usable format
  if (Array.isArray(errors)) {
    const result: Record<string, string[]> = {};
    errors.forEach((err: any) => {
      const field = err.field || err.property || 'general';
      const message = err.message || err.defaultMessage || 'Validation error';
      if (!result[field]) {
        result[field] = [];
      }
      result[field].push(message);
    });
    return result;
  }

  return errors as Record<string, string[]>;
}

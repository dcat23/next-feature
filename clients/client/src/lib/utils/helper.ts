import { ProblemDetail } from '../error';

/**
 * [show-error-toast]
 * next-feature@0.0.11-beta
 * November 4th 2025, 11:58:52 am
 */
export function showErrorToast(data: any) {
  return data;
}

export function getFieldError(
  error: ProblemDetail | undefined,
  fieldName: string
): string | undefined {
  if (!error) return undefined;

  const errors = error.errors as Record<string, string>;
  return errors?.[fieldName];
}

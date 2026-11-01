import 'server-only';

import { ApiError } from '../error';
import type { ApiResponse } from '../types';

interface WithApiOptions<T> {
  fallbackData?: T;
  successMessage?: string;
}

export function withApi<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options?: WithApiOptions<Result>,
): (...args: Args) => Promise<ApiResponse<Result>> {
  const opts = {
    fallbackData: {} as Result,
    successMessage: 'success',
    ...options,
  };

  return async (...args: Args) => {
    try {
      const response = await fn(...args);
      return {
        success: true,
        message: opts.successMessage,
        data: response,
      };
    } catch (e) {
      const apiError = ApiError.of(e);
      return {
        data: opts.fallbackData,
        // plain ProblemDetail: an ApiError instance would not survive being
        // returned from a 'use server' action
        error: apiError.problemDetail,
        message: apiError.message,
        success: false,
      };
    }
  };
}

export function withForm<State>(
  fn: (formData: FormData) => Promise<ApiResponse<State>>,
) {
  return async (prevState: Awaited<ApiResponse<State>>, formData: FormData) => {
    const response = await fn(formData);
    return response.error || !response.success
      ? { ...response, data: prevState.data }
      : response;
  };
}

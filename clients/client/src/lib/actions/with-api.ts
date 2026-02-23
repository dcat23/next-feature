import { ApiError } from '../error';
import type { ApiResponse } from '../types';

type WrapperFn<T, F extends (...args: unknown[]) => Promise<T> | T> = (
  ...args: Parameters<F>
) => Promise<ApiResponse<T>>;

interface WithApiOptions<T> {
  fallbackData?: T | null;
  successMessage?: string;
}

export const withApi = <T, F extends (...args: any[]) => Promise<T>>(
  fn: F,
  options?: WithApiOptions<T>,
): WrapperFn<T, F> => {
  options ??= {};
  options.fallbackData ??= null;
  options.successMessage ??= 'success';

  return async (...args: Parameters<F>) => {
    try {
      const response = await fn(args);
      return {
        success: true,
        message: options.successMessage,
        data: response,
      };
    } catch (e) {
      const apiError = ApiError.of(e);
      return {
        data: options.fallbackData,
        error: apiError.body,
        message: apiError.message,
        success: false,
      };
    }
  };
};

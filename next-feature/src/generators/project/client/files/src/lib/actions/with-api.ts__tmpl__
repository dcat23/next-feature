import { ApiError } from '../error';
import type { ApiResponse } from '../types';

type WrapperFn<F extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<F>
) => Promise<ApiResponse<ReturnType<F>>>;


interface WithApiOptions<T> {
  fallbackData?: T | null,
  successMessage?: string;
}

export const withApi = <F extends (...args: any[]) => any>(
  fn: F,
  options?: WithApiOptions<ReturnType<F>>
): WrapperFn<F> => {
  options.fallbackData ??= null;
  options.successMessage ??= "success";

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
  }
}
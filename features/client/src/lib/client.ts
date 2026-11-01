import 'server-only';

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  Method,
} from 'axios';
import type { ApiClientConfig, ApiClientLogger } from './types/client';
import handleApiError from './utils/error';
import { CLIENT_API_URL } from './config/env';

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _retryCount?: number;
};

/** Retrying these can't repeat a side effect */
const IDEMPOTENT_METHODS: Method[] = [
  'get',
  'head',
  'options',
  'put',
  'delete',
];

const consoleLogger: ApiClientLogger = {
  info: (obj, msg) => console.info(msg ?? '', obj),
  warn: (obj, msg) => console.warn(msg ?? '', obj),
  error: (obj, msg) => console.error(msg ?? '', obj),
};

/**
 * Axios wrapper with retries, JWT refresh and ProblemDetail errors.
 *
 * Instances are usually module-level (lib/config/client.ts) and so shared by
 * every request the server handles: per-request state such as an in-flight
 * token refresh is keyed by the request's own token, never stored on the
 * instance for all callers.
 */
export class ApiClient {
  private readonly instance: AxiosInstance;
  /** In-flight refreshes, keyed by the expired Authorization header */
  private readonly refreshes = new Map<string, Promise<string>>();
  private readonly retryMethods: Set<string>;
  private readonly logger: ApiClientLogger;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      baseURL: CLIENT_API_URL,
      timeout: 30000,
      enableRefreshToken: false,
      maxRetries: 1,
      retryDelay: 1000,
      skipRefreshPaths: [],
      onUnauthorized: async () => {
        // no-op by default
      },
      onRefreshTokenExpired: async () => {
        // no-op by default
      },
      onAuthenticated: async () => {
        // no-op by default
      },
      onRefreshToken: async () => {
        return '';
      },
      ...config,
    };

    this.logger = this.config.logger ?? consoleLogger;
    this.retryMethods = new Set(
      (this.config.retryMethods ?? IDEMPOTENT_METHODS).map((method) =>
        method.toLowerCase(),
      ),
    );

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        ...this.config.headers,
        ...(this.config.userAgent && { 'User-Agent': this.config.userAgent }),
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      this.handleRequestFulfilled.bind(this),
      this.handleRequestRejected.bind(this),
    );

    this.instance.interceptors.response.use(
      this.handleResponseFulfilled.bind(this),
      this.handleResponseRejected.bind(this),
    );
  }

  /**
   * Run onAuthenticated (e.g. attach the session's token). A failing hook is
   * logged and the request still goes out, as before.
   */
  private async handleRequestFulfilled(
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> {
    try {
      await this.config.onAuthenticated?.(config);
    } catch (error) {
      this.logger.error(
        { err: error, method: config.method, url: config.url },
        'onAuthenticated failed; sending the request without it',
      );
    }
    return config;
  }

  private handleRequestRejected(error: unknown): Promise<never> {
    this.logger.error({ err: error }, 'Request configuration error');
    return Promise.reject(error);
  }

  private handleResponseFulfilled(response: AxiosResponse): AxiosResponse {
    return response;
  }

  /**
   * Check if a path should skip the refresh token logic
   */
  private shouldSkipRefresh(url: string | undefined): boolean {
    if (!url || !this.config.skipRefreshPaths?.length) {
      return false;
    }
    return this.config.skipRefreshPaths.some((pattern) => pattern.test(url));
  }

  /**
   * Handle response errors with token refresh and retries
   */
  private async handleResponseRejected(error: AxiosError): Promise<unknown> {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (!originalRequest) {
      return Promise.reject(handleApiError(error));
    }

    if (
      error.response?.status === 401 &&
      this.config.enableRefreshToken &&
      !this.shouldSkipRefresh(originalRequest.url)
    ) {
      return this.handleUnauthorizedError(error, originalRequest);
    }

    const delay = this.retryDelayFor(error, originalRequest);
    if (delay !== null) {
      return this.retryRequest(originalRequest, delay);
    }

    return Promise.reject(handleApiError(error));
  }

  /**
   * Refresh the token and retry. Concurrent requests holding the same expired
   * token share one refresh; requests with a different token (another user
   * on the same server) never receive this refresh's result.
   */
  private async handleUnauthorizedError(
    error: AxiosError,
    originalRequest: RetryableRequest,
  ): Promise<unknown> {
    // Already retried with a refreshed token: give up
    if (originalRequest._retry) {
      await this.config.onRefreshTokenExpired?.();
      return Promise.reject(handleApiError(error));
    }

    originalRequest._retry = true;

    const expiredToken = String(originalRequest.headers?.Authorization ?? '');
    const inFlight = expiredToken
      ? this.refreshes.get(expiredToken)
      : undefined;
    const refresh = inFlight ?? this.refreshToken(originalRequest);

    if (!inFlight && expiredToken) {
      this.refreshes.set(expiredToken, refresh);
      refresh.then(
        () => this.refreshes.delete(expiredToken),
        () => this.refreshes.delete(expiredToken),
      );
    }

    let token: string;
    try {
      token = await refresh;
    } catch {
      // Only the request that started the refresh reports it
      if (!inFlight) await this.config.onUnauthorized?.();
      return Promise.reject(handleApiError(error));
    }

    originalRequest.headers.Authorization = `Bearer ${token}`;
    return this.instance(originalRequest);
  }

  /**
   * Run onRefreshToken; an error or an empty token fails the refresh.
   */
  private async refreshToken(
    originalRequest: RetryableRequest,
  ): Promise<string> {
    try {
      const token = await this.config.onRefreshToken?.(originalRequest);
      if (!token) throw new Error('onRefreshToken returned no token');
      return token;
    } catch (error) {
      this.logger.error(
        {
          err: error,
          method: originalRequest.method,
          url: originalRequest.url,
        },
        'Token refresh failed',
      );
      throw error;
    }
  }

  /**
   * Delay before retrying, or null when the request shouldn't be retried:
   * only retryMethods, on network errors, 5xx (except 501) and 429. Uses
   * Retry-After when present, and gives up if it's longer than the timeout.
   */
  private retryDelayFor(
    error: AxiosError,
    config: RetryableRequest,
  ): number | null {
    const retryCount = config._retryCount ?? 0;
    if (retryCount >= (this.config.maxRetries ?? 0)) return null;
    if (!this.retryMethods.has((config.method ?? 'get').toLowerCase()))
      return null;

    const status = error.response?.status;
    const retryable =
      status === undefined ||
      status === 429 ||
      (status >= 500 && status !== 501);
    if (!retryable) return null;

    const backoff = (this.config.retryDelay ?? 0) * Math.pow(2, retryCount);
    const retryAfter = parseRetryAfter(
      error.response?.headers?.['retry-after'],
    );
    if (retryAfter === null) return backoff;
    if (this.config.timeout && retryAfter > this.config.timeout) return null;
    return retryAfter;
  }

  private async retryRequest(
    config: RetryableRequest,
    delay: number,
  ): Promise<unknown> {
    config._retryCount = (config._retryCount ?? 0) + 1;

    this.logger.warn(
      {
        method: config.method,
        url: config.url,
        attempt: config._retryCount,
        delay,
      },
      'Retrying request',
    );

    await this.sleep(delay);
    return this.instance(config);
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* eslint-disable @typescript-eslint/no-explicit-any -- T defaults to any so
     callers that omit it keep an untyped response, as before */
  /**
   * HTTP Methods with proper typing
   */

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  /* eslint-enable @typescript-eslint/no-explicit-any */

  /**
   * Get the underlying Axios instance for advanced usage
   */
  get axios(): AxiosInstance {
    return this.instance;
  }
}

/** Retry-After as milliseconds: delay-seconds or an HTTP date */
function parseRetryAfter(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

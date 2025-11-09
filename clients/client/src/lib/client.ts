import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, ProblemDetail } from './error';

/**
 * Configuration options for the API client
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  enableRefreshToken?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onAuthenticated?: (
    config: InternalAxiosRequestConfig
  ) => void | Promise<void>;
  onUnauthorized?: () => void | Promise<void>;
  onRefreshTokenExpired?: () => void | Promise<void>;
  onRefreshToken?: () => string | Promise<string>;
}

/**
 * Pending request queue item
 */
interface PendingRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

/**
 * Axios wrapper with JWT/Refresh token handling
 */
export class ApiClient {
  private readonly instance: AxiosInstance;
  private isRefreshing = false;
  private pendingRequests: PendingRequest[] = [];
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      enableRefreshToken: true,
      maxRetries: 3,
      retryDelay: 1000,
      onUnauthorized: async () => {
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },
      onRefreshTokenExpired: async () => {
        console.error('Session expired. Please login again.');
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
      },
      onAuthenticated: async (config) => {
        console.log('Authenticated', config.data);
      },
      onRefreshToken: async () => {
        return '';
      },
      ...config,
    };

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      this.handleRequestFulfilled.bind(this),
      this.handleRequestRejected.bind(this)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      this.handleResponseFulfilled.bind(this),
      this.handleResponseRejected.bind(this)
    );
  }

  /**
   * Attach JWT token to request headers
   */
  private async handleRequestFulfilled(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    try {
      if (this.config.onAuthenticated) {
        this.config.onAuthenticated(config);
      }

      return config;
    } catch (error) {
      console.error('Error attaching token to request:', error);
      return config;
    }
  }

  /**
   * Handle request errors
   */
  private handleRequestRejected(error: any): Promise<never> {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }

  /**
   * Pass through successful responses
   */
  private handleResponseFulfilled(response: AxiosResponse): AxiosResponse {
    return response;
  }

  /**
   * Handle response errors with retry logic and token refresh
   */
  private async handleResponseRejected(error: AxiosError): Promise<any> {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    if (!originalRequest) {
      return Promise.reject(this.createApiError(error));
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && this.config.enableRefreshToken) {
      return this.handleUnauthorizedError(error, originalRequest);
    }

    // Handle network errors and 5xx errors with retry logic
    if (this.shouldRetry(error, originalRequest)) {
      return this.retryRequest(originalRequest);
    }

    // Create and reject with custom ApiError
    return Promise.reject(this.createApiError(error));
  }

  /**
   * Handle 401 errors with token refresh
   */
  private async handleUnauthorizedError(
    error: AxiosError,
    originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }
  ): Promise<any> {
    // Prevent infinite loops
    if (originalRequest._retry) {
      if (this.config.onRefreshTokenExpired) {
        await this.config.onRefreshTokenExpired();
      }
      return Promise.reject(this.createApiError(error));
    }

    originalRequest._retry = true;

    // If already refreshing, queue the request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.pendingRequests.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return this.instance(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    this.isRefreshing = true;

    try {
      const newToken = await this.refreshToken();

      // Update the original request with new token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      // Resolve all pending requests with new token
      this.processPendingRequests(null, newToken);

      // Retry the original request
      return this.instance(originalRequest);
    } catch (refreshError) {
      // Reject all pending requests
      this.processPendingRequests(refreshError, null);

      if (this.config.onUnauthorized) {
        await this.config.onUnauthorized();
      }

      return Promise.reject(this.createApiError(error));
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresh the JWT token using the refresh token
   */
  private async refreshToken(): Promise<string> {
    try {
      // const session = await auth();
      //
      // if (!session?.user || !('refreshToken' in session.user)) {
      //   throw new Error('No refresh token available');
      // }
      //
      // const refreshToken = session.user.refreshToken as string;
      const refreshToken = this.config.onRefreshToken();

      // Call your refresh token endpoint
      const response = await axios.post<{ jwtToken: string }>(
        `${this.config.baseURL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const newToken = response.data.jwtToken;

      // Update the session with the new token
      // Note: You'll need to implement this based on your auth setup
      // This might involve updating cookies or calling an API route
      await this.updateSession(newToken);

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Update session with new token
   * Implement this based on your Next.js auth setup
   */
  private async updateSession(newToken: string): Promise<void> {
    // Example implementation - adjust based on your auth setup
    try {
      await fetch('/api/auth/update-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jwtToken: newToken }),
      });
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  }

  /**
   * Process all pending requests after token refresh
   */
  private processPendingRequests(error: any, token: string | null): void {
    this.pendingRequests.forEach((request) => {
      if (error) {
        request.reject(error);
      } else if (token) {
        request.resolve(token);
      }
    });

    this.pendingRequests = [];
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(
    error: AxiosError,
    config: InternalAxiosRequestConfig & { _retryCount?: number }
  ): boolean {
    const retryCount = config._retryCount || 0;

    // Don't retry if max retries exceeded
    if (retryCount >= this.config.maxRetries) {
      return false;
    }

    // Retry on network errors
    if (!error.response) {
      return true;
    }

    // Retry on 5xx server errors (except 501)
    const status = error.response.status;
    if (status >= 500 && status !== 501) {
      return true;
    }

    // Retry on 429 (Too Many Requests)
    if (status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Retry failed request with exponential backoff
   */
  private async retryRequest(
    config: InternalAxiosRequestConfig & { _retryCount?: number }
  ): Promise<any> {
    config._retryCount = (config._retryCount || 0) + 1;

    const delay = this.config.retryDelay * Math.pow(2, config._retryCount - 1);

    await this.sleep(delay);

    console.log(
      `Retrying request (attempt ${config._retryCount}):`,
      config.url
    );

    return this.instance(config);
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create ApiError from AxiosError
   */
  private createApiError(error: AxiosError): ApiError {
    const status = error.response?.status || 0;
    const problemDetail = this.extractProblemDetail(error);

    return new ApiError(status, problemDetail, error);
  }

  /**
   * Extract ProblemDetail from error response
   */
  private extractProblemDetail(error: AxiosError): ProblemDetail | null {
    if (!error.response?.data) {
      return null;
    }

    const data = error.response.data;

    // Check if response matches ProblemDetail structure
    if (
      typeof data === 'object' &&
      'type' in data &&
      'title' in data &&
      'status' in data
    ) {
      return data as ProblemDetail;
    }

    return null;
  }

  /**
   * HTTP Methods with proper typing
   */

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the underlying Axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

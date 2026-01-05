import { AxiosError, HttpStatusCode } from 'axios';
import { ZodError } from 'zod';

/**
 * Spring Boot ProblemDetail structure
 */
export interface ProblemDetail {
  type: string;
  title: string;
  status: HttpStatusCode;
  detail?: string;
  instance?: string;
  errors?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: HttpStatusCode,
    public problemDetail: ProblemDetail | null,
    public originalError?: Error,
    message?: string
  ) {
    super(
      message ||
        problemDetail?.detail ||
        problemDetail?.title ||
        originalError?.message ||
        'An error occurred'
    );
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  static builder<T>(): ApiErrorBuilder {
    return new ApiErrorBuilder<T>();
  }

  static of(error: Error | unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    return ApiError.builder()
      .originalError(error as Error)
      .build();
  }

  /**
   * Create ApiError from Zod validation error
   */
  static fromZodError(zodError: ZodError) {
    const errors: Record<string, string> = {};

    zodError.errors.forEach((error) => {
      error.path.forEach((path) => {
        errors[path] = error.message;
      });
    });

    return ApiError.builder()
      .originalError(zodError)
      .status(HttpStatusCode.BadRequest)
      .message('Validation error')
      .detail('errors', errors)
      .build();
  }
}

export class ApiErrorBuilder<
  AdditionalProblemDetails = Record<string, unknown>
> {
  private _problemDetail: ProblemDetail;
  private _status: HttpStatusCode;
  private _originalError: Error;
  private _message: string;

  constructor() {
    this._status = HttpStatusCode.InternalServerError;
    this._problemDetail = {
      status: this._status,
      title: '',
      type: 'about:blank',
    };
    this._originalError = new Error();
    this._message = '';
  }

  /**
   * Set standard ProblemDetail fields
   */
  detail<K extends keyof (ProblemDetail & AdditionalProblemDetails)>(
    key: K,
    value: K extends keyof ProblemDetail
      ? ProblemDetail[K]
      : K extends keyof AdditionalProblemDetails
      ? AdditionalProblemDetails[K]
      : unknown
  ): ApiErrorBuilder<AdditionalProblemDetails> {
    (this._problemDetail as any)[key] = value;
    return this;
  }

  /**
   * Set standard ProblemDetail fields
   */
  problemDetail(
    problemDetail: ProblemDetail
  ): ApiErrorBuilder<AdditionalProblemDetails> {
    if (problemDetail) {
      this._problemDetail = problemDetail;
    }
    return this;
  }

  originalError(error: Error): ApiErrorBuilder<AdditionalProblemDetails> {
    this._originalError = error;
    this._problemDetail.title = error.name;

    if (error instanceof AxiosError) {
      this.status(error.status as HttpStatusCode);
    }
    if (error instanceof ZodError) {
      this.status(HttpStatusCode.BadRequest);
      this.message('Validation error');
    }
    return this;
  }

  status(status: HttpStatusCode): ApiErrorBuilder<AdditionalProblemDetails> {
    this._status = status;
    this._problemDetail.status = status;
    return this;
  }

  message(msg: string): ApiErrorBuilder<AdditionalProblemDetails> {
    this._message = msg;
    this._problemDetail.detail = msg;
    return this;
  }

  build(): ApiError {
    return new ApiError(
      this._status,
      this._problemDetail,
      this._originalError,
      this._message
    );
  }
}

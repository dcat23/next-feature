import { HttpStatusCode } from 'axios';

/**
 * Result of a withApi-wrapped action.
 *
 * `error` is a plain ProblemDetail rather than an ApiError instance so the
 * response survives serialization when returned from a 'use server' action.
 * Rehydrate it with `ApiError.of(response.error)` for status helpers.
 *
 * [api-response]
 * next-feature@0.0.11-beta
 * November 4th 2025, 6:37:27 pm
 */
export interface ApiResponse<Response> {
  success?: boolean;
  message?: string;
  error?: ProblemDetail;
  data: Response;
}

/**
 * Spring Boot ProblemDetail structure
 *
 * [problem-detail]
 * next-feature@0.1.1-beta.5
 * January 11th 2026, 8:55:50 pm
 */
export interface ProblemDetail {
  type: string;
  title: string;
  status: HttpStatusCode;
  detail: string;
  instance?: string;
  errors?: Record<string, string>;
}

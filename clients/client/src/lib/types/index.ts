import { ProblemDetail } from '../error';

/**
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

import 'server-only';

import {
  context,
  propagation,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import type { AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

/**
 * OpenTelemetry client spans for ApiClient requests. Without a registered
 * tracer provider (the app's instrumentation.ts registers one only when an
 * OTLP endpoint is configured) every call here is a no-op: spans don't
 * record and no trace headers are sent.
 */
const tracer = trace.getTracer('@next-feature/client');

/** The span of each in-flight attempt, keyed by axios' per-attempt config */
const spans = new WeakMap<InternalAxiosRequestConfig, Span>();

const headerSetter = {
  set(headers: AxiosRequestHeaders, key: string, value: string) {
    headers.set(key, value);
  },
};

/** scheme://host/path: never credentials or the query string, which can carry tokens */
function targetUrl(uri: string): URL | undefined {
  try {
    const url = new URL(uri);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return undefined;
  }
}

/**
 * Starts a CLIENT span for one attempt of a request (retries get their own,
 * with `http.request.resend_count`) and injects its context into the request
 * headers (W3C `traceparent`, plus `baggage` with the default propagators),
 * so the backend's spans join the same trace.
 */
export function startRequestSpan(
  config: InternalAxiosRequestConfig & { _retryCount?: number },
  uri: string,
): void {
  const method = (config.method ?? 'get').toUpperCase();
  const url = targetUrl(uri);
  const span = tracer.startSpan(method, {
    kind: SpanKind.CLIENT,
    attributes: {
      'http.request.method': method,
      ...(url && {
        'url.full': url.href,
        'server.address': url.hostname,
        'server.port':
          Number(url.port) || (url.protocol === 'https:' ? 443 : 80),
      }),
      ...(config._retryCount && {
        'http.request.resend_count': config._retryCount,
      }),
    },
  });
  spans.set(config, span);
  propagation.inject(
    trace.setSpan(context.active(), span),
    config.headers,
    headerSetter,
  );
}

/** Ends the attempt's span: status code, and an error status for failures and 4xx/5xx */
export function endRequestSpan(
  config: InternalAxiosRequestConfig,
  status?: number,
  error?: unknown,
): void {
  const span = spans.get(config);
  if (!span) return;
  spans.delete(config);

  if (status !== undefined)
    span.setAttribute('http.response.status_code', status);
  if (status !== undefined && status >= 400) {
    span.setAttribute('error.type', String(status));
    span.setStatus({ code: SpanStatusCode.ERROR });
  } else if (error) {
    // No response: timeout, connection refused, ...
    const code = (error as { code?: unknown }).code;
    span.setAttribute('error.type', typeof code === 'string' ? code : '_OTHER');
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as { message?: string }).message,
    });
  }
  span.end();
}

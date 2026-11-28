import 'server-only';

import { isSpanContextValid, trace } from '@opentelemetry/api';

/**
 * Trace fields of a log line, named as in OpenTelemetry's pino
 * instrumentation, so backends link the line to its trace.
 */
export interface LogTraceContext {
  trace_id?: string;
  span_id?: string;
  trace_flags?: string;
}

/**
 * The active span's ids, for correlating logs with traces. Empty when there
 * is no active span: tracing isn't registered (no OTLP endpoint configured),
 * or the code runs outside a traced request.
 */
export function getTraceContext(): LogTraceContext {
  const spanContext = trace.getActiveSpan()?.spanContext();
  if (!spanContext || !isSpanContextValid(spanContext)) return {};
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
    trace_flags: `0${spanContext.traceFlags.toString(16)}`,
  };
}

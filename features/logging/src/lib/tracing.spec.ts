import { context, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import pino from 'pino';
import { Writable } from 'stream';
import { createPinoOptions } from '../config';
import { getTraceContext } from './tracing';

jest.mock('server-only', () => ({}));

/** A production-style logger (no pino-pretty transport) writing JSON lines to `lines` */
function createLogger(options: Parameters<typeof createPinoOptions>[0] = {}) {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(JSON.parse(chunk.toString()));
      callback();
    },
  });
  // the dev transport (pino-pretty) would replace the stream
  const pinoOptions = { ...createPinoOptions(options), transport: undefined };
  return { logger: pino(pinoOptions, stream), lines };
}

describe('trace correlation', () => {
  it('adds nothing without registered tracing', () => {
    expect(getTraceContext()).toEqual({});
    const { logger, lines } = createLogger();
    logger.info('hello');
    expect(lines[0]).not.toHaveProperty('trace_id');
  });

  describe('with a tracer provider', () => {
    const tracer = new BasicTracerProvider().getTracer('test');

    beforeAll(() => {
      context.setGlobalContextManager(
        new AsyncLocalStorageContextManager().enable(),
      );
    });
    afterAll(() => context.disable());

    it("adds the active span's trace_id, span_id and trace_flags to log lines", () => {
      const { logger, lines } = createLogger();
      tracer.startActiveSpan('request', (span) => {
        logger.info('inside');
        span.end();
      });
      logger.info('outside');

      expect(trace.getActiveSpan()).toBeUndefined();
      expect(lines[0]).toMatchObject({ msg: 'inside', trace_flags: '01' });
      expect(lines[0]['trace_id']).toMatch(/^[0-9a-f]{32}$/);
      expect(lines[0]['span_id']).toMatch(/^[0-9a-f]{16}$/);
      expect(lines[1]).not.toHaveProperty('trace_id');
    });

    it('can be turned off with traceContext: false', () => {
      const { logger, lines } = createLogger({ traceContext: false });
      tracer.startActiveSpan('request', (span) => {
        logger.info('inside');
        span.end();
      });
      expect(lines[0]).not.toHaveProperty('trace_id');
    });
  });
});

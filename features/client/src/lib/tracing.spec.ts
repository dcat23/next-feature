import {
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiClient } from './client';
import type { ApiClientConfig } from './types/client';

jest.mock('server-only', () => ({}));

type Handler = (config: InternalAxiosRequestConfig) => {
  status: number;
  data?: unknown;
};

function createClient(handler: Handler, config: ApiClientConfig = {}) {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const client = new ApiClient({
    baseURL: 'http://api.test:8080/v1',
    retryDelay: 0,
    logger,
    ...config,
  });
  const requests: InternalAxiosRequestConfig[] = [];
  client.axios.defaults.adapter = async (request) => {
    requests.push({ ...request, headers: new AxiosHeaders(request.headers) });
    const { status, data = {} } = handler(request);
    const response: AxiosResponse = {
      status,
      statusText: String(status),
      data,
      headers: {},
      config: request,
    };
    if (status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        'ERR_BAD_RESPONSE',
        request,
        null,
        response,
      );
    }
    return response;
  };
  return { client, requests };
}

describe('ApiClient tracing', () => {
  describe('without a registered tracer provider', () => {
    it('sends no trace headers', async () => {
      const { client, requests } = createClient(() => ({ status: 200 }));
      await client.get('/users');
      expect(requests[0].headers['traceparent']).toBeUndefined();
    });
  });

  describe('with a tracer provider', () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    const tracer = provider.getTracer('test');

    beforeAll(() => {
      context.setGlobalContextManager(
        new AsyncLocalStorageContextManager().enable(),
      );
      propagation.setGlobalPropagator(new W3CTraceContextPropagator());
      trace.setGlobalTracerProvider(provider);
    });
    afterEach(() => exporter.reset());
    afterAll(() => {
      trace.disable();
      propagation.disable();
      context.disable();
    });

    /** Runs `fn` inside a parent span, as Next.js' request span would be */
    const inParent = <T>(fn: () => Promise<T>) =>
      tracer.startActiveSpan('request', async (parent) => {
        try {
          return { result: await fn(), parent };
        } finally {
          parent.end();
        }
      });

    const clientSpans = () =>
      exporter
        .getFinishedSpans()
        .filter((span) => span.kind === SpanKind.CLIENT);

    it('records a CLIENT span under the active span and sends its traceparent', async () => {
      const { client, requests } = createClient(() => ({ status: 200 }));
      const { parent } = await inParent(() =>
        client.get('/users?token=secret'),
      );

      const [span] = clientSpans();
      expect(span.name).toBe('GET');
      expect(span.spanContext().traceId).toBe(parent.spanContext().traceId);
      expect(span.parentSpanContext?.spanId).toBe(parent.spanContext().spanId);
      expect(span.attributes).toEqual({
        'http.request.method': 'GET',
        // no query string: it can carry tokens
        'url.full': 'http://api.test:8080/v1/users',
        'server.address': 'api.test',
        'server.port': 8080,
        'http.response.status_code': 200,
      });
      expect(span.status.code).toBe(SpanStatusCode.UNSET);

      const { traceId, spanId } = span.spanContext();
      expect(requests[0].headers['traceparent']).toBe(
        `00-${traceId}-${spanId}-01`,
      );
    });

    it('marks 4xx/5xx responses as errors', async () => {
      const { client } = createClient(() => ({ status: 404 }));
      await inParent(() => client.get('/users/1').catch(() => undefined));
      const [span] = clientSpans();
      expect(span.attributes['http.response.status_code']).toBe(404);
      expect(span.attributes['error.type']).toBe('404');
      expect(span.status.code).toBe(SpanStatusCode.ERROR);
    });

    it('records network errors without a status code', async () => {
      const { client } = createClient(
        (request) => {
          throw new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED', request);
        },
        { maxRetries: 0 },
      );
      await inParent(() => client.get('/users').catch(() => undefined));
      const [span] = clientSpans();
      expect(span.attributes['http.response.status_code']).toBeUndefined();
      expect(span.attributes['error.type']).toBe('ECONNREFUSED');
      expect(span.status).toEqual({
        code: SpanStatusCode.ERROR,
        message: 'connect ECONNREFUSED',
      });
    });

    it('gives each retry its own span with http.request.resend_count', async () => {
      let calls = 0;
      const { client, requests } = createClient(() => ({
        status: ++calls === 1 ? 503 : 200,
      }));
      await inParent(() => client.get('/users'));
      const spans = clientSpans();
      expect(
        spans.map((span) => span.attributes['http.response.status_code']),
      ).toEqual([503, 200]);
      expect(spans[1].attributes['http.request.resend_count']).toBe(1);
      // the retry carries its own span id
      expect(requests[1].headers['traceparent']).toContain(
        spans[1].spanContext().spanId,
      );
    });

    it('traces nothing with tracing: false', async () => {
      const { client, requests } = createClient(() => ({ status: 200 }), {
        tracing: false,
      });
      await inParent(() => client.get('/users'));
      expect(clientSpans()).toEqual([]);
      expect(requests[0].headers['traceparent']).toBeUndefined();
    });
  });
});

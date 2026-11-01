import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ApiClient } from './client';
import type { ApiClientConfig, ApiClientLogger } from './types/client';

jest.mock('server-only', () => ({}));

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown; headers?: Record<string, string> };

const silentLogger = (): ApiClientLogger => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() });

/** ApiClient whose requests are answered by `handler` instead of the network */
function createClient(handler: Handler, config: ApiClientConfig = {}) {
  const client = new ApiClient({ baseURL: 'http://api.test', retryDelay: 0, logger: silentLogger(), ...config });
  const requests: InternalAxiosRequestConfig[] = [];
  client.axios.defaults.adapter = async (request) => {
    requests.push({ ...request, headers: new AxiosHeaders(request.headers) });
    const { status, data = {}, headers = {} } = handler(request);
    const response: AxiosResponse = { status, statusText: String(status), data, headers, config: request };
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', request, null, response);
    }
    return response;
  };
  return { client, requests };
}

describe('ApiClient', () => {
  describe('headers', () => {
    it('sends userAgent and headers with every request', async () => {
      const { client, requests } = createClient(() => ({ status: 200 }), {
        userAgent: 'orders/1.2.0',
        headers: { 'X-Tenant': 'acme' },
      });
      await client.get('/users');
      expect(requests[0].headers['User-Agent']).toBe('orders/1.2.0');
      expect(requests[0].headers['X-Tenant']).toBe('acme');
    });
  });

  describe('retries', () => {
    it('retries an idempotent method on a 5xx', async () => {
      let calls = 0;
      const { client } = createClient(() => ({ status: ++calls === 1 ? 503 : 200, data: { ok: true } }));
      await expect(client.get('/users')).resolves.toEqual({ ok: true });
      expect(calls).toBe(2);
    });

    it('does not retry POST by default', async () => {
      let calls = 0;
      const { client } = createClient(() => {
        calls++;
        return { status: 503 };
      });
      await expect(client.post('/orders', {})).rejects.toBeDefined();
      expect(calls).toBe(1);
    });

    it('retries POST when retryMethods includes it', async () => {
      let calls = 0;
      const { client } = createClient(() => ({ status: ++calls === 1 ? 503 : 200 }), { retryMethods: ['post'] });
      await client.post('/orders', {});
      expect(calls).toBe(2);
    });

    it('does not retry a 4xx other than 429', async () => {
      let calls = 0;
      const { client } = createClient(() => {
        calls++;
        return { status: 404 };
      });
      await expect(client.get('/users')).rejects.toBeDefined();
      expect(calls).toBe(1);
    });

    it('waits for Retry-After', async () => {
      jest.useFakeTimers();
      try {
        let calls = 0;
        const { client } = createClient(() =>
          ++calls === 1 ? { status: 429, headers: { 'retry-after': '2' } } : { status: 200 }
        );
        const request = client.get('/users');
        await jest.advanceTimersByTimeAsync(1999);
        expect(calls).toBe(1);
        await jest.advanceTimersByTimeAsync(1);
        await request;
        expect(calls).toBe(2);
      } finally {
        jest.useRealTimers();
      }
    });

    it('gives up when Retry-After is longer than the timeout', async () => {
      let calls = 0;
      const { client } = createClient(
        () => {
          calls++;
          return { status: 503, headers: { 'retry-after': '60' } };
        },
        { timeout: 1000 }
      );
      await expect(client.get('/users')).rejects.toBeDefined();
      expect(calls).toBe(1);
    });

    it('logs retries through the logger', async () => {
      const logger = silentLogger();
      let calls = 0;
      const { client } = createClient(() => ({ status: ++calls === 1 ? 502 : 200 }), { logger });
      await client.get('/users');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/users', attempt: 1 }),
        'Retrying request'
      );
    });
  });

  describe('token refresh', () => {
    /** 401 unless the request carries `Bearer <user>-fresh`; returns the token it was sent */
    const authHandler: Handler = (request) => {
      const auth = String(request.headers.Authorization ?? '');
      return auth.endsWith('-fresh') ? { status: 200, data: { auth } } : { status: 401 };
    };

    it('scopes concurrent refreshes per token, so users never get each other’s token', async () => {
      const onRefreshToken = jest.fn(async (request: InternalAxiosRequestConfig) => {
        const user = String(request.headers.Authorization).replace('Bearer ', '').replace('-expired', '');
        await new Promise((resolve) => setTimeout(resolve, 10));
        return `${user}-fresh`;
      });
      const { client } = createClient(authHandler, { enableRefreshToken: true, onRefreshToken });

      const [a1, b, a2] = await Promise.all([
        client.get('/me', { headers: { Authorization: 'Bearer alice-expired' } }),
        client.get('/me', { headers: { Authorization: 'Bearer bob-expired' } }),
        client.get('/me', { headers: { Authorization: 'Bearer alice-expired' } }),
      ]);

      expect(a1).toEqual({ auth: 'Bearer alice-fresh' });
      expect(a2).toEqual({ auth: 'Bearer alice-fresh' });
      expect(b).toEqual({ auth: 'Bearer bob-fresh' });
      // alice's two requests shared one refresh
      expect(onRefreshToken).toHaveBeenCalledTimes(2);
    });

    it('rejects when onRefreshToken returns no token', async () => {
      const onUnauthorized = jest.fn();
      const { client, requests } = createClient(authHandler, {
        enableRefreshToken: true,
        onRefreshToken: async () => '',
        onUnauthorized,
      });
      await expect(client.get('/me', { headers: { Authorization: 'Bearer alice-expired' } })).rejects.toBeDefined();
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      // never retried with `Bearer `
      expect(requests).toHaveLength(1);
    });

    it('rejects and logs when onRefreshToken throws', async () => {
      const logger = silentLogger();
      const { client } = createClient(authHandler, {
        enableRefreshToken: true,
        logger,
        onRefreshToken: async () => {
          throw new Error('refresh endpoint down');
        },
      });
      await expect(client.get('/me', { headers: { Authorization: 'Bearer alice-expired' } })).rejects.toBeDefined();
      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ url: '/me' }), 'Token refresh failed');
    });

    it('calls onRefreshTokenExpired when the refreshed token is rejected too', async () => {
      const onRefreshTokenExpired = jest.fn();
      const { client } = createClient(() => ({ status: 401 }), {
        enableRefreshToken: true,
        onRefreshToken: async () => 'still-bad',
        onRefreshTokenExpired,
      });
      await expect(client.get('/me', { headers: { Authorization: 'Bearer x' } })).rejects.toBeDefined();
      expect(onRefreshTokenExpired).toHaveBeenCalledTimes(1);
    });
  });

  describe('onAuthenticated', () => {
    it('logs a failing hook and still sends the request', async () => {
      const logger = silentLogger();
      const { client, requests } = createClient(() => ({ status: 200 }), {
        logger,
        onAuthenticated: async () => {
          throw new Error('no session');
        },
      });
      await client.get('/users');
      expect(requests).toHaveLength(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/users' }),
        'onAuthenticated failed; sending the request without it'
      );
    });
  });
});

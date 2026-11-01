import 'server-only';

import type { IncomingMessage, ServerResponse } from 'http';
import type { LoggerOptions } from 'pino';

import { pinoOptions } from '../../config';

/** The fields of pino-http's serialized request used below */
interface SerializedRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * Registers the pino-http request logger for the Node.js runtime. Call it from
 * the app's `instrumentation.ts`, passing `createPinoOptions({ service })`.
 */
export const registerPino = async (options: LoggerOptions = pinoOptions) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const [{ default: pinoHttp }, { default: pino }] = await Promise.all([
      import('pino-http'),
      import('pino'),
    ]);

    const logger = pino(options);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__httpLogger = pinoHttp({
      logger,
      customLogLevel(_req: IncomingMessage, res: ServerResponse, err: unknown) {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      serializers: {
        req(req: SerializedRequest) {
          return {
            method: req.method,
            url: req.url,
            correlationId: req.headers?.['x-correlation-id'],
          };
        },
        res(res: { statusCode: number }) {
          return { statusCode: res.statusCode };
        },
      },
    });

    logger.info('Next.js server logging registered');
  }
};

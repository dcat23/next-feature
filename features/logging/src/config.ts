import { LOGGING_SERVICE_NAME } from './lib/config/env';

const isDev = process.env.NODE_ENV !== 'production';

export const pinoOptions = {
  base: { service: LOGGING_SERVICE_NAME },
  level: 'info' as const,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
};

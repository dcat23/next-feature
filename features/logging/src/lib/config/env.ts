import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  /* schema start */
  NEXT_PUBLIC_LOGGING_BEACON_PATH: z.string().optional(),
  LOGGING_SERVICE_NAME: z.string().optional(),
  /* schema end */
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}

export const NODE_ENV = process.env.NODE_ENV;
/* vars start */
export const NEXT_PUBLIC_LOGGING_BEACON_PATH =
  process.env.NEXT_PUBLIC_LOGGING_BEACON_PATH;
export const LOGGING_SERVICE_NAME = process.env.LOGGING_SERVICE_NAME;
/* vars end */

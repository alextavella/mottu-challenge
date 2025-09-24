import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  RABBITMQ_URL: z.url(),
  RABBITMQ_EXCHANGE: z.string().default('events'),
  RABBITMQ_RECONNECT_ATTEMPTS: z.coerce.number().default(5),
  RABBITMQ_RECONNECT_DELAY: z.coerce.number().default(5000),
  RABBITMQ_HEARTBEAT: z.coerce.number().default(60),
  EVENTS_ENABLE_RETRY: z.coerce.boolean().default(true),
  EVENTS_RETRY_ATTEMPTS: z.coerce.number().default(3),
  EVENTS_RETRY_DELAY: z.coerce.number().default(1000),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

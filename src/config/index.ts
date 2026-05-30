import { z } from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(10, 'ANTHROPIC_API_KEY is required'),
  RESEND_API_KEY:    z.string().min(10, 'RESEND_API_KEY is required'),
  NOTIFY_EMAIL:      z.string().email().default('victor.gorinov@gmail.com'),
  PORT:              z.string().regex(/^\d+$/).default('3000'),
  NODE_ENV:          z.enum(['development', 'production', 'staging', 'test']).default('development'),
});

const _env = EnvSchema.safeParse(process.env);
if (!_env.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(_env.error.flatten().fieldErrors);
  process.exit(1);
}

export const ENV              = _env.data;
export const PORT             = parseInt(ENV.PORT, 10);
export const ANTHROPIC_API_KEY = ENV.ANTHROPIC_API_KEY;
export const RESEND_API_KEY    = ENV.RESEND_API_KEY;
export const NOTIFY_EMAIL      = ENV.NOTIFY_EMAIL;

export const AI_MODEL   = 'claude-haiku-4-5-20251001' as const;
export const AI_TIMEOUT = 30_000;


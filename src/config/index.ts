import { z } from 'zod';
import 'dotenv/config';
import { normalizeEmail } from '../domain/auth/email.js';

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(10, 'ANTHROPIC_API_KEY is required'),
  RESEND_API_KEY:    z.string().min(10, 'RESEND_API_KEY is required'),
  NOTIFY_EMAIL:      z.string().email().default('victor.gorinov@gmail.com'),
  PORT:              z.string().regex(/^\d+$/).default('3000'),
  NODE_ENV:          z.enum(['development', 'production', 'staging', 'test']).default('development'),
  DATABASE_URL:      z.string().min(10, 'DATABASE_URL is required'),
  JWT_SECRET:        z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY:        z.string().default('7d'),
  COOKIE_DOMAIN:     z.string().optional(),
  // Comma-separated emails auto-promoted to role='admin' at register/login.
  // Bootstraps the first admin without a manual SQL UPDATE in prod.
  ADMIN_EMAILS:      z.string().default(''),
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
export const DATABASE_URL      = ENV.DATABASE_URL;
export const JWT_SECRET        = ENV.JWT_SECRET;
export const JWT_EXPIRY        = ENV.JWT_EXPIRY;
export const COOKIE_DOMAIN     = ENV.COOKIE_DOMAIN;

export const AI_MODEL   = 'claude-haiku-4-5-20251001' as const;
export const AI_TIMEOUT = 30_000;

// Normalized via the shared normalizeEmail() (same transform auth.schema.ts
// applies), so a listed address matches regardless of the casing it was
// registered with.
const ADMIN_EMAIL_SET = new Set(
  ENV.ADMIN_EMAILS.split(',').map((e) => normalizeEmail(e)).filter(Boolean),
);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAIL_SET.has(normalizeEmail(email));
}


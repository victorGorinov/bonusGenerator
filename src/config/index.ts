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
  // Beta lockdown: when true, every tool route requires a logged-in session
  // (requireAuth instead of optionalAuth) and the frontend guard bounces guests
  // to /login.html. A single reversible switch for the closed beta — flip it
  // back to false to reopen guest access without a code change.
  // Accept ANY string and only treat the explicit "true"/"1" tokens (case-
  // insensitive) as on — everything else, including unset, an empty string
  // (BETA_LOCKDOWN= in Vercel), or a typo like "yes"/"TRUE", resolves to false.
  // A prior z.enum() here would fail EnvSchema and crash the whole server at boot
  // on an empty/mis-cased value; this can never throw.
  BETA_LOCKDOWN:     z.string().trim().toLowerCase().default('false')
                       .transform((v) => v === 'true' || v === '1'),
  // AI cost guardrails (beta). Defaults ARE the agreed beta numbers, so the caps
  // apply even if the Vercel env vars are never set (fail-safe).
  //   AI_BUDGET_USD        — hard global kill-switch: at/over this cumulative spend
  //                          all AI routes 503; deterministic routes keep working.
  //   AI_BUDGET_ALERT_USD  — soft threshold: log a warning once when first crossed.
  //   AI_USER_DAILY_LIMIT  — AI calls per user per (UTC) day.
  //   AI_USER_TOTAL_LIMIT  — AI calls per user across the whole beta.
  // Non-negative (not strictly positive): 0 is a valid "hard-disable" value —
  // AI_BUDGET_USD=0 keeps the kill-switch permanently tripped (all AI 503), a
  // 0 quota blocks every per-user call — rather than crashing startup.
  AI_BUDGET_USD:       z.coerce.number().nonnegative().default(20),
  AI_BUDGET_ALERT_USD: z.coerce.number().nonnegative().default(12),
  AI_USER_DAILY_LIMIT: z.coerce.number().int().nonnegative().default(30),
  AI_USER_TOTAL_LIMIT: z.coerce.number().int().nonnegative().default(120),
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
export const BETA_LOCKDOWN      = ENV.BETA_LOCKDOWN;

export const AI_BUDGET_USD       = ENV.AI_BUDGET_USD;
export const AI_BUDGET_ALERT_USD = ENV.AI_BUDGET_ALERT_USD;
export const AI_USER_DAILY_LIMIT = ENV.AI_USER_DAILY_LIMIT;
export const AI_USER_TOTAL_LIMIT = ENV.AI_USER_TOTAL_LIMIT;

export const AI_MODEL   = 'claude-haiku-4-5-20251001' as const;
// Live web-search calls (competitor lookup) run on a stronger model: better at
// finding + summarising real public bonus terms, and it supports the
// dynamic-filtering web_search tool. Only the /api/competitor/search path uses
// it; everything else stays on the cheaper Haiku AI_MODEL.
export const AI_SEARCH_MODEL = 'claude-sonnet-5' as const;
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


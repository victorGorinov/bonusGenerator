import { z } from 'zod';
import { normalizeEmail } from '../domain/auth/email.js';

// Normalize (trim + lowercase) before .email() so both registration and login key
// off the same address — Postgres' UNIQUE on users.email is case-sensitive, so
// without this "Alice@x.com" and "alice@x.com" would be different accounts.
// Shares normalizeEmail() with the ADMIN_EMAILS bootstrap so the two can't drift.
const EmailSchema = z.preprocess(
  (v) => (typeof v === 'string' ? normalizeEmail(v) : v),
  z.string().email().max(320),
);

export const RegisterSchema = z.object({
  name:     z.string().min(1).max(200),
  email:    EmailSchema,
  password: z.string().min(8).max(200),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email:    EmailSchema,
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof LoginSchema>;

import { z } from 'zod';

// trim().toLowerCase() before .email() so both registration and login key off
// the same normalized address — Postgres' UNIQUE constraint on users.email is
// case-sensitive, so without this "Alice@x.com" and "alice@x.com" would be
// treated as different accounts.
const EmailSchema = z.string().trim().toLowerCase().email().max(320);

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

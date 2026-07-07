// Single source of email normalization. users.email has a plain case-sensitive
// Postgres UNIQUE (no citext), so every path that keys off an address —
// register/login (auth.schema.ts) and the ADMIN_EMAILS bootstrap (config) — must
// normalize identically or a differently-cased address silently fails to match.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

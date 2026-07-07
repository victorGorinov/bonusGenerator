import type { Pool } from 'pg';
import { hashPassword, verifyPassword } from '../domain/auth/hashPassword.js';
import { AppError } from '../errors/AppError.js';
import { isAdminEmail } from '../config/index.js';
import type { AccessRow } from '../domain/auth/access.js';
import type { RegisterInput, LoginInput } from '../validation/auth.schema.js';

export interface AuthUser {
  id:    string;
  name:  string;
  email: string;
}

// Identity (AuthUser) + the access columns the app gates on. Returned by
// getUserAccessById for /api/auth/me, /api/features, and the enforcement middleware.
export interface UserWithAccess extends AuthUser, AccessRow {}

export async function registerUser(db: Pool, input: RegisterInput): Promise<AuthUser> {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing.rowCount) throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');

  const passwordHash = await hashPassword(input.password);

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // ADMIN_EMAILS bootstrap — a listed address registers straight as admin, so
    // the first admin never needs a manual SQL UPDATE in prod.
    const role = isAdminEmail(input.email) ? 'admin' : 'user';
    const userRes = await client.query<{ id: string; name: string; email: string }>(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [input.email, passwordHash, input.name, role],
    );
    const user = userRes.rows[0];
    if (!user) throw new AppError('Failed to create user', 500, 'INTERNAL_ERROR');
    await client.query(
      'INSERT INTO workspaces (name, owner_id) VALUES ($1, $2)',
      [`${input.name}'s workspace`, user.id],
    );
    await client.query('COMMIT');
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    // The SELECT above is a fast-path check, not a lock — two concurrent
    // registrations for the same email can both pass it before either commits.
    // The UNIQUE constraint on users.email is the real guard; translate its
    // violation (23505) into the same 409 the fast-path produces.
    if (isUniqueViolation(err)) throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');
    throw err;
  } finally {
    client.release();
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === '23505';
}

export async function loginUser(db: Pool, input: LoginInput): Promise<AuthUser> {
  const res = await db.query<{ id: string; name: string; email: string; password_hash: string; status: string }>(
    'SELECT id, name, email, password_hash, status FROM users WHERE email = $1',
    [input.email],
  );
  const row = res.rows[0];
  if (!row) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  const ok = await verifyPassword(input.password, row.password_hash);
  if (!ok) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  // A disabled account must not be able to re-mint a session — enforce at the
  // credential gate, not only downstream at requireFeature/requireAdmin.
  if (row.status === 'disabled') throw new AppError('Account disabled', 403, 'ACCOUNT_DISABLED');

  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [row.id]);
  return { id: row.id, name: row.name, email: row.email };
}

// Throws 403 ACCOUNT_DISABLED if the user is disabled (or 401 if the id no longer
// resolves). Used by the requireAuth-only surfaces (/api/auth/me, /api/saved) that
// don't go through requireFeature/requireAdmin, so "disabled" is enforced everywhere
// an authenticated caller can reach, not just the feature-gated tool routes.
export async function assertActiveUser(db: Pool, id: string): Promise<void> {
  const res = await db.query<{ status: string }>('SELECT status FROM users WHERE id = $1', [id]);
  const row = res.rows[0];
  if (!row) throw new AppError('User not found', 401, 'UNAUTHENTICATED');
  if (row.status === 'disabled') throw new AppError('Account disabled', 403, 'ACCOUNT_DISABLED');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Identity + access columns in one indexed lookup. Used by /api/auth/me,
// /api/features, requireFeature, and requireAdmin — always from the DB (never
// the JWT), so a role change / disable / feature toggle by an admin takes effect
// on the user's very next request instead of only after their token expires.
//
// A malformed id (e.g. a hand-forged/legacy token whose `sub` isn't a UUID)
// returns null rather than letting Postgres throw `invalid input syntax for
// type uuid` — callers treat "no such user" (null) and "lookup failed" (throw)
// differently, so a bad id must not masquerade as a transient DB error.
export async function getUserAccessById(db: Pool, id: string): Promise<UserWithAccess | null> {
  if (!UUID_RE.test(id)) return null;
  const res = await db.query<UserWithAccess>(
    'SELECT id, name, email, role, status, plan, features FROM users WHERE id = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

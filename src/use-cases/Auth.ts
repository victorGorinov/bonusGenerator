import type { Pool } from 'pg';
import { hashPassword, verifyPassword } from '../domain/auth/hashPassword.js';
import { AppError } from '../errors/AppError.js';
import type { RegisterInput, LoginInput } from '../validation/auth.schema.js';

export interface AuthUser {
  id:    string;
  name:  string;
  email: string;
}

export async function registerUser(db: Pool, input: RegisterInput): Promise<AuthUser> {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing.rowCount) throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');

  const passwordHash = await hashPassword(input.password);

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const userRes = await client.query<{ id: string; name: string; email: string }>(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, name, email',
      [input.email, passwordHash, input.name],
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
  const res = await db.query<{ id: string; name: string; email: string; password_hash: string }>(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [input.email],
  );
  const row = res.rows[0];
  if (!row) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  const ok = await verifyPassword(input.password, row.password_hash);
  if (!ok) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [row.id]);
  return { id: row.id, name: row.name, email: row.email };
}

export async function getUserById(db: Pool, id: string): Promise<AuthUser | null> {
  const res = await db.query<{ id: string; name: string; email: string }>(
    'SELECT id, name, email FROM users WHERE id = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

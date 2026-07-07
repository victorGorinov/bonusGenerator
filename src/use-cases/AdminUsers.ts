import type { Pool, PoolClient } from 'pg';
import { AppError } from '../errors/AppError.js';
import type { AdminUpdateUserInput, AdminListQueryInput } from '../validation/admin.schema.js';

export interface AdminUserView {
  id:            string;
  email:         string;
  name:          string;
  role:          string;
  status:        string;
  plan:          string;
  features:      Record<string, boolean>;
  created_at:    string;
  last_login_at: string | null;
}

const VIEW_COLS =
  'id, email, name, role, status, plan, features, created_at, last_login_at';

// Escape LIKE/ILIKE metacharacters so a search for "a_b" or "100%" is treated as
// a literal, not a wildcard pattern (paired with ESCAPE '\' in the query).
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listUsers(
  db: Pool,
  { q, limit, offset }: AdminListQueryInput,
): Promise<{ users: AdminUserView[]; total: number }> {
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    const rows = await db.query<AdminUserView>(
      `SELECT ${VIEW_COLS} FROM users WHERE email ILIKE $3 ESCAPE '\\' OR name ILIKE $3 ESCAPE '\\'
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset, pattern],
    );
    const countRes = await db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM users WHERE email ILIKE $1 ESCAPE '\\' OR name ILIKE $1 ESCAPE '\\'`,
      [pattern],
    );
    return { users: rows.rows, total: Number(countRes.rows[0]?.count ?? 0) };
  }
  const rows = await db.query<AdminUserView>(
    `SELECT ${VIEW_COLS} FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  const countRes = await db.query<{ count: string }>('SELECT COUNT(*)::int AS count FROM users');
  return { users: rows.rows, total: Number(countRes.rows[0]?.count ?? 0) };
}

export async function getUser(db: Pool, id: string): Promise<AdminUserView> {
  const res = await db.query<AdminUserView>(
    `SELECT ${VIEW_COLS} FROM users WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (!row) throw new AppError('User not found', 404, 'NOT_FOUND');
  return row;
}

// Locks the active-admin set FOR UPDATE and returns its size. Two concurrent
// demote/disable/delete transactions both take this lock on the SAME rows, so
// they serialize: the second re-reads the (now smaller) set and the last-admin
// guard sees the truth instead of a stale count (fixes the read-then-write race).
async function lockActiveAdminCount(client: PoolClient): Promise<number> {
  const res = await client.query("SELECT id FROM users WHERE role = 'admin' AND status = 'active' FOR UPDATE");
  return res.rowCount ?? 0;
}

async function withTx<T>(db: Pool, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateUser(
  db: Pool,
  { id, adminId, patch }: { id: string; adminId: string; patch: AdminUpdateUserInput },
): Promise<AdminUserView> {
  return withTx(db, async (client) => {
    const targetRes = await client.query<AdminUserView>(
      `SELECT ${VIEW_COLS} FROM users WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const target = targetRes.rows[0];
    if (!target) throw new AppError('User not found', 404, 'NOT_FOUND');

    // An admin can't lock themselves out of the panel.
    if (id === adminId) {
      if (patch.role && patch.role !== 'admin') {
        throw new AppError('You cannot remove your own admin role', 400, 'CANNOT_SELF_DEMOTE');
      }
      if (patch.status && patch.status !== 'active') {
        throw new AppError('You cannot disable your own account', 400, 'CANNOT_SELF_DISABLE');
      }
    }

    // Don't let the last active admin be demoted or disabled.
    const losesAdmin =
      target.role === 'admin' &&
      target.status === 'active' &&
      ((patch.role && patch.role !== 'admin') || patch.status === 'disabled');
    if (losesAdmin && (await lockActiveAdminCount(client)) <= 1) {
      throw new AppError('At least one active admin must remain', 400, 'LAST_ADMIN');
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (patch.role     !== undefined) { sets.push(`role = $${i++}`);     values.push(patch.role); }
    if (patch.status   !== undefined) { sets.push(`status = $${i++}`);   values.push(patch.status); }
    if (patch.plan     !== undefined) { sets.push(`plan = $${i++}`);     values.push(patch.plan); }
    if (patch.features !== undefined) { sets.push(`features = $${i++}`); values.push(JSON.stringify(patch.features)); }
    values.push(id);

    const res = await client.query<AdminUserView>(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${VIEW_COLS}`,
      values,
    );
    const row = res.rows[0];
    if (!row) throw new AppError('User not found', 404, 'NOT_FOUND');
    return row;
  });
}

export async function deleteUser(
  db: Pool,
  { id, adminId }: { id: string; adminId: string },
): Promise<void> {
  await withTx(db, async (client) => {
    const targetRes = await client.query<{ role: string; status: string }>(
      'SELECT role, status FROM users WHERE id = $1 FOR UPDATE',
      [id],
    );
    const target = targetRes.rows[0];
    if (!target) throw new AppError('User not found', 404, 'NOT_FOUND');

    if (id === adminId) {
      throw new AppError('You cannot delete your own account', 400, 'CANNOT_SELF_DELETE');
    }
    if (target.role === 'admin' && target.status === 'active' && (await lockActiveAdminCount(client)) <= 1) {
      throw new AppError('At least one active admin must remain', 400, 'LAST_ADMIN');
    }
    // ON DELETE CASCADE (workspaces.owner_id) removes the user's workspace too.
    await client.query('DELETE FROM users WHERE id = $1', [id]);
  });
}

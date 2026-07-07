import { describe, it, expect } from 'vitest';
import { updateUser, deleteUser } from '../../src/use-cases/AdminUsers.js';

// Minimal fake Pool+Client — routes queries by SQL shape so the guard logic can
// be tested without a real Postgres. updateUser/deleteUser run in a transaction
// (db.connect() → client with BEGIN/…/COMMIT), so the client is what matters.
function makeDb({ target, adminCount = 1, updated }) {
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)/.test(sql)) return { rows: [], rowCount: 0 };
    if (/FROM users WHERE id = \$1 FOR UPDATE/.test(sql)) {
      return { rows: target ? [target] : [], rowCount: target ? 1 : 0 };
    }
    if (/role = 'admin' AND status = 'active' FOR UPDATE/.test(sql)) {
      return { rows: Array.from({ length: adminCount }, () => ({ id: 'x' })), rowCount: adminCount };
    }
    if (/UPDATE users SET/.test(sql)) return { rows: [updated ?? { ...target }], rowCount: 1 };
    if (/DELETE FROM users/.test(sql)) return { rows: [], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  };
  const client = { query, release: () => {} };
  return { calls, query, connect: async () => client };
}

const admin = { id: 'a1', email: 'a@x.io', name: 'A', role: 'admin', status: 'active', plan: 'free', features: {} };
const user  = { id: 'u1', email: 'u@x.io', name: 'U', role: 'user',  status: 'active', plan: 'free', features: {} };

describe('AdminUsers guards — updateUser', () => {
  it('blocks an admin from removing their own admin role', async () => {
    const db = makeDb({ target: admin });
    await expect(updateUser(db, { id: 'a1', adminId: 'a1', patch: { role: 'user' } }))
      .rejects.toMatchObject({ code: 'CANNOT_SELF_DEMOTE' });
  });

  it('blocks an admin from disabling their own account', async () => {
    const db = makeDb({ target: admin });
    await expect(updateUser(db, { id: 'a1', adminId: 'a1', patch: { status: 'disabled' } }))
      .rejects.toMatchObject({ code: 'CANNOT_SELF_DISABLE' });
  });

  it('blocks demoting the last active admin', async () => {
    const db = makeDb({ target: admin, adminCount: 1 });
    await expect(updateUser(db, { id: 'a1', adminId: 'other', patch: { role: 'user' } }))
      .rejects.toMatchObject({ code: 'LAST_ADMIN' });
  });

  it('allows demoting an admin when another active admin remains', async () => {
    const db = makeDb({ target: admin, adminCount: 2, updated: { ...admin, role: 'user' } });
    const res = await updateUser(db, { id: 'a1', adminId: 'other', patch: { role: 'user' } });
    expect(res.role).toBe('user');
  });

  it('persists feature overrides as JSON on a normal user', async () => {
    const db = makeDb({ target: user, updated: { ...user, features: { reports: false } } });
    await updateUser(db, { id: 'u1', adminId: 'a1', patch: { features: { reports: false } } });
    const upd = db.calls.find((c) => /UPDATE users/.test(c.sql));
    expect(upd).toBeDefined();
    expect(upd.params).toContain(JSON.stringify({ reports: false }));
  });

  it('404s on a missing user', async () => {
    const db = makeDb({ target: null });
    await expect(updateUser(db, { id: 'nope', adminId: 'a1', patch: { plan: 'pro' } }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('AdminUsers guards — deleteUser', () => {
  it('blocks deleting your own account', async () => {
    const db = makeDb({ target: admin });
    await expect(deleteUser(db, { id: 'a1', adminId: 'a1' }))
      .rejects.toMatchObject({ code: 'CANNOT_SELF_DELETE' });
  });

  it('blocks deleting the last active admin', async () => {
    const db = makeDb({ target: admin, adminCount: 1 });
    await expect(deleteUser(db, { id: 'a1', adminId: 'other' }))
      .rejects.toMatchObject({ code: 'LAST_ADMIN' });
  });

  it('deletes a normal user', async () => {
    const db = makeDb({ target: user });
    await expect(deleteUser(db, { id: 'u1', adminId: 'a1' })).resolves.toBeUndefined();
    expect(db.calls.some((c) => /DELETE FROM users/.test(c.sql))).toBe(true);
  });
});

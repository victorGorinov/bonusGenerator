import { describe, it, expect } from 'vitest';
import { getUserAccessById } from '../../src/use-cases/Auth.js';

// getUserAccessById must return null (not throw) for a malformed id, so
// requireFeature can distinguish "no such user" (→ guest) from a real DB error
// (→ fail closed). No DB is touched: the UUID guard short-circuits before any query.
describe('getUserAccessById — malformed id tolerance', () => {
  const throwingDb = { query: async () => { throw new Error('should not reach the DB'); } };

  it('returns null for a non-UUID id without querying', async () => {
    await expect(getUserAccessById(throwingDb, 'test-user')).resolves.toBeNull();
    await expect(getUserAccessById(throwingDb, '')).resolves.toBeNull();
    await expect(getUserAccessById(throwingDb, '12345')).resolves.toBeNull();
  });

  it('queries for a well-formed UUID', async () => {
    const db = { query: async () => ({ rows: [{ id: '11111111-1111-4111-8111-111111111111', role: 'user' }] }) };
    const row = await getUserAccessById(db, '11111111-1111-4111-8111-111111111111');
    expect(row).toMatchObject({ role: 'user' });
  });
});

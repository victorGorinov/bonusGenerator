import { describe, it, expect, vi } from 'vitest';
import { registerUser } from '../../src/use-cases/Auth.js';

// Simulates the race the code review flagged: the pre-check SELECT sees no
// existing row (two concurrent registrations both pass it), but the INSERT
// hits the real UNIQUE constraint. A fake Pool/client lets us trigger that
// without a live Postgres.
function makeFakeDb({ insertError }) {
  const client = {
    query: vi.fn(async (sql) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return {};
      if (typeof sql === 'string' && sql.startsWith('INSERT INTO users')) {
        throw insertError;
      }
      return { rows: [{}] };
    }),
    release: vi.fn(),
  };
  return {
    query: vi.fn(async () => ({ rowCount: 0, rows: [] })), // pre-check SELECT: no existing row
    connect: vi.fn(async () => client),
  };
}

describe('registerUser — concurrent-registration race', () => {
  it('translates a Postgres unique-violation (23505) into 409 EMAIL_TAKEN instead of a raw 500', async () => {
    const pgUniqueViolation = Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' });
    const db = makeFakeDb({ insertError: pgUniqueViolation });

    await expect(
      registerUser(db, { name: 'Bob', email: 'bob@example.com', password: 'correcthorse' }),
    ).rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  it('rethrows an unrelated INSERT failure unchanged', async () => {
    const otherError = Object.assign(new Error('connection terminated'), { code: '57P01' });
    const db = makeFakeDb({ insertError: otherError });

    await expect(
      registerUser(db, { name: 'Bob', email: 'bob@example.com', password: 'correcthorse' }),
    ).rejects.toThrow('connection terminated');
  });
});

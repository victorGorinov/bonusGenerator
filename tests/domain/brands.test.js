import { describe, it, expect } from 'vitest';
import { createBrand, updateBrand, deleteBrand } from '../../src/use-cases/Brands.js';
import { BrandCreateSchema, BrandDataSchema } from '../../src/validation/brand.schema.js';

// Minimal fake Pool+Client routing by SQL shape — same approach as
// adminUsers.test.js, so the quota/default guards are testable without Postgres.
function makeDb({ existing = 0, inserted, rowForUpdate, deleted, failWith } = {}) {
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)/.test(sql)) return { rows: [], rowCount: 0 };
    if (/SELECT id FROM brands WHERE workspace_id = \$1 FOR UPDATE/.test(sql)) {
      return { rows: Array.from({ length: existing }, (_, i) => ({ id: 'b' + i })), rowCount: existing };
    }
    if (/SELECT COUNT\(\*\)::int AS count FROM brands/.test(sql)) {
      return { rows: [{ count: existing }], rowCount: 1 };
    }
    if (/FROM brands WHERE workspace_id = \$1 AND id = \$2 FOR UPDATE/.test(sql)) {
      return { rows: rowForUpdate ? [rowForUpdate] : [], rowCount: rowForUpdate ? 1 : 0 };
    }
    if (/INSERT INTO brands/.test(sql)) {
      if (failWith) throw failWith;
      return { rows: [inserted ?? mkRow({ name: params[1], is_default: params[2] })], rowCount: 1 };
    }
    if (/DELETE FROM brands/.test(sql)) {
      return { rows: deleted ? [deleted] : [], rowCount: deleted ? 1 : 0 };
    }
    if (/UPDATE brands SET/.test(sql)) {
      if (failWith) throw failWith;
      return { rows: [rowForUpdate ?? mkRow({})], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  };
  const client = { query, release: () => {} };
  return { calls, query, connect: async () => client };
}

function mkRow(over) {
  return {
    id: 'b1', name: 'Casino X', is_default: false, data: {},
    created_at: '2026-07-27T00:00:00Z', updated_at: '2026-07-27T00:00:00Z',
    ...over,
  };
}

const WS = 'ws-1';

describe('createBrand — plan quota', () => {
  it('rejects a create once the quota is used up', async () => {
    const db = makeDb({ existing: 1 });
    await expect(createBrand(db, { workspaceId: WS, limit: 1, input: { name: 'Second' } }))
      .rejects.toMatchObject({ code: 'BRAND_LIMIT_REACHED', status: 403 });
  });

  it('rejects every create when the quota is zero (guest-level limit)', async () => {
    const db = makeDb({ existing: 0 });
    await expect(createBrand(db, { workspaceId: WS, limit: 0, input: { name: 'Any' } }))
      .rejects.toMatchObject({ code: 'BRAND_LIMIT_REACHED' });
  });

  it('allows a create below the quota', async () => {
    const db = makeDb({ existing: 1 });
    const b = await createBrand(db, { workspaceId: WS, limit: 3, input: { name: 'Second' } });
    expect(b.name).toBe('Second');
  });

  it('takes a per-workspace advisory lock before the INSERT (no read-then-write race)', async () => {
    const db = makeDb({ existing: 1 });
    await createBrand(db, { workspaceId: WS, limit: 3, input: { name: 'Second' } });
    const lockIdx   = db.calls.findIndex((c) => /pg_advisory_xact_lock/.test(c.sql));
    const insertIdx = db.calls.findIndex((c) => /INSERT INTO brands/.test(c.sql));
    expect(lockIdx).toBeGreaterThanOrEqual(0);
    expect(lockIdx).toBeLessThan(insertIdx);
  });

  it('skips the quota check (and its lock) entirely for an unlimited (admin) caller', async () => {
    const db = makeDb({ existing: 99 });
    const b = await createBrand(db, { workspaceId: WS, limit: Infinity, input: { name: 'Hundredth' } });
    expect(b).toBeDefined();
    expect(db.calls.some((c) => /pg_advisory_xact_lock/.test(c.sql))).toBe(false);
  });

  it('makes the FIRST brand of a workspace the default', async () => {
    const db = makeDb({ existing: 0 });
    await createBrand(db, { workspaceId: WS, limit: 3, input: { name: 'First' } });
    const insert = db.calls.find((c) => /INSERT INTO brands/.test(c.sql));
    expect(insert.params[2]).toBe(true);
  });

  it('does not auto-default a later brand unless asked', async () => {
    const db = makeDb({ existing: 1 });
    await createBrand(db, { workspaceId: WS, limit: 3, input: { name: 'Second' } });
    const insert = db.calls.find((c) => /INSERT INTO brands/.test(c.sql));
    expect(insert.params[2]).toBe(false);
  });

  it('clears the previous default when creating an explicit default', async () => {
    const db = makeDb({ existing: 1 });
    await createBrand(db, { workspaceId: WS, limit: 3, input: { name: 'Second', isDefault: true } });
    expect(db.calls.some((c) => /UPDATE brands SET is_default = FALSE/.test(c.sql))).toBe(true);
  });

  it('translates a unique-name violation into 409 rather than a 500', async () => {
    const db = makeDb({ existing: 1, failWith: Object.assign(new Error('dup'), { code: '23505' }) });
    await expect(createBrand(db, { workspaceId: WS, limit: 3, input: { name: 'Casino X' } }))
      .rejects.toMatchObject({ code: 'BRAND_NAME_TAKEN', status: 409 });
  });
});

describe('updateBrand / deleteBrand', () => {
  it('404s when the brand is not in the caller workspace', async () => {
    const db = makeDb({ rowForUpdate: null });
    await expect(updateBrand(db, { workspaceId: WS, id: 'b9', patch: { name: 'X' } }))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('replaces `data` wholesale so a cleared field really clears', async () => {
    const db = makeDb({ rowForUpdate: mkRow({ data: { geo: 'de', rtp: 96 } }) });
    await updateBrand(db, { workspaceId: WS, id: 'b1', patch: { data: { geo: 'uk' } } });
    const upd = db.calls.find((c) => /UPDATE brands SET/.test(c.sql));
    expect(upd.params).toContain(JSON.stringify({ geo: 'uk' }));
  });

  it('clears the other default when promoting a brand', async () => {
    const db = makeDb({ rowForUpdate: mkRow({}) });
    await updateBrand(db, { workspaceId: WS, id: 'b1', patch: { isDefault: true } });
    expect(db.calls.some((c) => /UPDATE brands SET is_default = FALSE/.test(c.sql) && /id <> \$2/.test(c.sql))).toBe(true);
  });

  it('404s on deleting a brand that is not there', async () => {
    const db = makeDb({ deleted: null });
    await expect(deleteBrand(db, { workspaceId: WS, id: 'b9' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('moves the default flag to the oldest remaining brand', async () => {
    const db = makeDb({ deleted: { is_default: true } });
    await deleteBrand(db, { workspaceId: WS, id: 'b1' });
    expect(db.calls.some((c) => /UPDATE brands SET is_default = TRUE/.test(c.sql))).toBe(true);
  });

  it('leaves the default alone when a non-default brand is deleted', async () => {
    const db = makeDb({ deleted: { is_default: false } });
    await deleteBrand(db, { workspaceId: WS, id: 'b2' });
    expect(db.calls.some((c) => /UPDATE brands SET is_default = TRUE/.test(c.sql))).toBe(false);
  });
});

describe('brand data schema — the tools read these values back into forms', () => {
  it('accepts a full brand', () => {
    const parsed = BrandCreateSchema.safeParse({
      name: 'Casino X',
      data: { geo: 'br', curMode: 'usd', segment: 'vip', plat: 'mobile', players: 20000, avgdep: 45, arpu: 60, rtp: 96.5, providers: ['Evolution'] },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an unknown key instead of silently storing a dead field', () => {
    expect(BrandDataSchema.safeParse({ geo: 'de', wager: 30 }).success).toBe(false);
  });

  it('rejects values outside the tool ranges', () => {
    expect(BrandDataSchema.safeParse({ players: 50 }).success).toBe(false);       // min 100
    expect(BrandDataSchema.safeParse({ rtp: 120 }).success).toBe(false);          // max 99.9
    expect(BrandDataSchema.safeParse({ geo: 'atlantis' }).success).toBe(false);   // not a known geo
  });

  it('accepts a partially-filled brand (every parameter is optional)', () => {
    expect(BrandDataSchema.safeParse({}).success).toBe(true);
    expect(BrandDataSchema.safeParse({ geo: 'de' }).success).toBe(true);
  });

  it('requires a non-empty name', () => {
    expect(BrandCreateSchema.safeParse({ name: '   ' }).success).toBe(false);
  });
});

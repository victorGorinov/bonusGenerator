import type { Pool, PoolClient } from 'pg';
import { AppError } from '../errors/AppError.js';
import type { BrandCreateInput, BrandUpdateInput } from '../validation/brand.schema.js';

export interface BrandView {
  id:        string;
  name:      string;
  isDefault: boolean;
  data:      Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface BrandRow {
  id: string; name: string; is_default: boolean; data: Record<string, unknown>;
  created_at: unknown; updated_at: unknown;
}

const COLS = 'id, name, is_default, data, created_at, updated_at';

function mapRow(r: BrandRow): BrandView {
  return {
    id:        r.id,
    name:      r.name,
    isDefault: r.is_default,
    data:      r.data ?? {},
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
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

// Postgres unique-violation. Two indexes can raise it here:
//   idx_brands_ws_name    — duplicate name in the workspace
//   idx_brands_ws_default — two defaults (only reachable on a real race, since
//                           setDefault clears the old one in the same tx)
function isUniqueViolation(err: unknown): err is { code: string; constraint?: string } {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

export async function listBrands(db: Pool, workspaceId: string): Promise<BrandView[]> {
  const res = await db.query<BrandRow>(
    `SELECT ${COLS} FROM brands WHERE workspace_id = $1 ORDER BY is_default DESC, created_at ASC`,
    [workspaceId],
  );
  return res.rows.map(mapRow);
}

export async function countBrands(db: Pool, workspaceId: string): Promise<number> {
  const res = await db.query<{ count: string }>(
    'SELECT COUNT(*)::int AS count FROM brands WHERE workspace_id = $1',
    [workspaceId],
  );
  return Number(res.rows[0]?.count ?? 0);
}

/**
 * Create a brand, enforcing the caller's plan quota.
 *
 * The count and the INSERT run in ONE transaction, serialized per workspace by a
 * transaction-scoped advisory lock — two concurrent creates would otherwise both
 * read an unlocked count and land an extra row (the same read-then-write race the
 * last-admin guard fixes in AdminUsers.ts). A plain `SELECT … FOR UPDATE` on the
 * existing rows is NOT enough here: under READ COMMITTED it locks only rows that
 * already exist, so it cannot block a concurrent INSERT on a plan with limit >= 2
 * (limit = 1 happens to be safe via the is_default unique index, but we don't rely
 * on that). `limit` comes from resolveLimits() at the controller edge; Infinity
 * (admin) skips the check.
 */
export async function createBrand(
  db: Pool,
  { workspaceId, limit, input }: { workspaceId: string; limit: number; input: BrandCreateInput },
): Promise<BrandView> {
  return withTx(db, async (client) => {
    if (Number.isFinite(limit)) {
      // Serialize concurrent creates for this workspace so the count→INSERT below is
      // atomic w.r.t. other creators (see the doc comment for why FOR UPDATE isn't).
      // Released automatically at COMMIT/ROLLBACK. Key is namespaced to brand quota.
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`brand_quota:${workspaceId}`]);
      const used = await client.query<{ count: string }>(
        'SELECT COUNT(*)::int AS count FROM brands WHERE workspace_id = $1',
        [workspaceId],
      ).then((r) => Number(r.rows[0]?.count ?? 0));
      if (used >= limit) {
        throw new AppError(
          `Brand limit reached for your plan (${limit})`,
          403,
          'BRAND_LIMIT_REACHED',
        );
      }
    }

    // First brand of a workspace is the default — otherwise a fresh account has
    // brands but nothing pre-selected in the pickers.
    const existing = await client.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM brands WHERE workspace_id = $1',
      [workspaceId],
    );
    const isFirst = Number(existing.rows[0]?.count ?? 0) === 0;
    const makeDefault = input.isDefault === true || isFirst;

    if (makeDefault) {
      await client.query(
        'UPDATE brands SET is_default = FALSE, updated_at = NOW() WHERE workspace_id = $1 AND is_default',
        [workspaceId],
      );
    }

    try {
      const res = await client.query<BrandRow>(
        `INSERT INTO brands (workspace_id, name, is_default, data)
         VALUES ($1, $2, $3, $4) RETURNING ${COLS}`,
        [workspaceId, input.name, makeDefault, JSON.stringify(input.data ?? {})],
      );
      const row = res.rows[0];
      if (!row) throw new AppError('Failed to create brand', 500, 'INTERNAL_ERROR');
      return mapRow(row);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError('A brand with this name already exists', 409, 'BRAND_NAME_TAKEN');
      }
      throw err;
    }
  });
}

export async function updateBrand(
  db: Pool,
  { workspaceId, id, patch }: { workspaceId: string; id: string; patch: BrandUpdateInput },
): Promise<BrandView> {
  return withTx(db, async (client) => {
    const cur = await client.query<BrandRow>(
      `SELECT ${COLS} FROM brands WHERE workspace_id = $1 AND id = $2 FOR UPDATE`,
      [workspaceId, id],
    );
    if (!cur.rows[0]) throw new AppError('Brand not found', 404, 'NOT_FOUND');

    if (patch.isDefault === true) {
      await client.query(
        'UPDATE brands SET is_default = FALSE, updated_at = NOW() WHERE workspace_id = $1 AND is_default AND id <> $2',
        [workspaceId, id],
      );
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (patch.name      !== undefined) { sets.push(`name = $${i++}`);       values.push(patch.name); }
    // `data` is replaced wholesale, not merged: the profile form always submits
    // the complete brand, so a merge would make clearing a field impossible.
    if (patch.data      !== undefined) { sets.push(`data = $${i++}`);       values.push(JSON.stringify(patch.data)); }
    if (patch.isDefault !== undefined) { sets.push(`is_default = $${i++}`); values.push(true); }
    sets.push('updated_at = NOW()');
    values.push(workspaceId, id);

    try {
      const res = await client.query<BrandRow>(
        `UPDATE brands SET ${sets.join(', ')} WHERE workspace_id = $${i++} AND id = $${i} RETURNING ${COLS}`,
        values,
      );
      const row = res.rows[0];
      if (!row) throw new AppError('Brand not found', 404, 'NOT_FOUND');
      return mapRow(row);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError('A brand with this name already exists', 409, 'BRAND_NAME_TAKEN');
      }
      throw err;
    }
  });
}

/**
 * Delete a brand. If it was the default, the flag moves to the oldest remaining
 * brand in the same transaction — a workspace with brands always has a default,
 * so the pickers never end up with nothing selected.
 */
export async function deleteBrand(
  db: Pool,
  { workspaceId, id }: { workspaceId: string; id: string },
): Promise<void> {
  await withTx(db, async (client) => {
    const res = await client.query<{ is_default: boolean }>(
      'DELETE FROM brands WHERE workspace_id = $1 AND id = $2 RETURNING is_default',
      [workspaceId, id],
    );
    const removed = res.rows[0];
    if (!removed) throw new AppError('Brand not found', 404, 'NOT_FOUND');
    if (!removed.is_default) return;

    await client.query(
      `UPDATE brands SET is_default = TRUE, updated_at = NOW()
       WHERE id = (SELECT id FROM brands WHERE workspace_id = $1 ORDER BY created_at ASC LIMIT 1)`,
      [workspaceId],
    );
  });
}

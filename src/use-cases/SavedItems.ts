import type { Pool } from 'pg';
import { AppError } from '../errors/AppError.js';
import type { SaveItemInput } from '../validation/savedItems.schema.js';

// Entity registry — the ONLY source of table names. Route keys map to a table
// here; nothing table-related ever comes from request input, so the hardcoded
// identifiers below are safe to interpolate into SQL (all *values* are still
// parameterized). All six tables share the uniform {client_id, data} shape.
export const ENTITIES: Record<string, string> = {
  configs:              'saved_configs',
  campaigns:            'ai_campaigns',
  tournaments:          'saved_tournaments',
  'loyalty-programs':   'saved_loyalty_programs',
  'calendar-events':    'calendar_events',
  'calendar-templates': 'calendar_templates',
  'competitor-comparisons': 'competitor_comparisons',
};

export function resolveTable(key: string): string {
  const table = ENTITIES[key];
  if (!table) throw new AppError('Unknown item type', 404, 'NOT_FOUND');
  return table;
}

// The frontend record, verbatim, as it was stored — plus server timestamps.
export type SavedRow = { id: string; data: unknown; createdAt: string; updatedAt: string };

function mapRow(row: { client_id: string; data: unknown; created_at: unknown; updated_at: unknown }): SavedRow {
  return {
    id:        row.client_id,
    data:      row.data,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listItems(db: Pool, table: string, workspaceId: string): Promise<SavedRow[]> {
  const res = await db.query(
    `SELECT client_id, data, created_at, updated_at FROM ${table}
     WHERE workspace_id = $1 ORDER BY created_at DESC`,
    [workspaceId],
  );
  return res.rows.map(mapRow);
}

// Upsert keyed by (workspace_id, client_id): a re-save of the same client record
// (edit, or the one-time localStorage migration re-run) updates in place instead
// of duplicating. Bumps updated_at on conflict.
export async function upsertItem(
  db: Pool,
  table: string,
  workspaceId: string,
  input: SaveItemInput,
): Promise<SavedRow> {
  const res = await db.query(
    `INSERT INTO ${table} (workspace_id, client_id, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (workspace_id, client_id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
     RETURNING client_id, data, created_at, updated_at`,
    [workspaceId, input.id, input.data],
  );
  return mapRow(res.rows[0]);
}

export async function deleteItem(db: Pool, table: string, workspaceId: string, clientId: string): Promise<void> {
  const res = await db.query(
    `DELETE FROM ${table} WHERE workspace_id = $1 AND client_id = $2`,
    [workspaceId, clientId],
  );
  if (!res.rowCount) throw new AppError('Item not found', 404, 'NOT_FOUND');
}

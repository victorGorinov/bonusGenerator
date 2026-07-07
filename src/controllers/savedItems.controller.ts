import type { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import { ValidationError } from '../errors/ValidationError.js';
import { SaveItemSchema } from '../validation/savedItems.schema.js';
import { resolveTable, listItems, upsertItem, deleteItem } from '../use-cases/SavedItems.js';

interface Deps { db: Pool }

// requireAuth + requireWorkspace run before these, so req.workspaceId is always set.
function workspaceId(req: import('express').Request): string {
  if (!req.workspaceId) throw new AppError('Workspace not resolved', 500, 'INTERNAL_ERROR');
  return req.workspaceId;
}

export function createSavedItemsController({ db }: Deps) {
  return {
    list: asyncHandler<{ entity: string }>(async (req, res) => {
      const table = resolveTable(req.params.entity);
      const items = await listItems(db, table, workspaceId(req));
      res.json({ items });
    }),

    // Validated inline (not via the validate() middleware) so the same handler
    // serves every entity — the generic :entity param can't be wired to one schema.
    save: asyncHandler<{ entity: string }>(async (req, res) => {
      const table = resolveTable(req.params.entity);
      const parsed = SaveItemSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.flatten());
      const item = await upsertItem(db, table, workspaceId(req), parsed.data);
      res.status(201).json({ item });
    }),

    remove: asyncHandler<{ entity: string; id: string }>(async (req, res) => {
      const table = resolveTable(req.params.entity);
      await deleteItem(db, table, workspaceId(req), req.params.id);
      res.json({ ok: true });
    }),
  };
}

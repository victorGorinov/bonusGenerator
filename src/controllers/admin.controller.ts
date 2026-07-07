import type { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listUsers, getUser, updateUser, deleteUser } from '../use-cases/AdminUsers.js';
import { type AdminListQueryInput, type AdminUpdateUserInput } from '../validation/admin.schema.js';
import { FEATURES, FEATURE_PRESETS } from '../config/features.js';

interface Deps { db: Pool }

export function createAdminController({ db }: Deps) {
  return {
    // Static metadata the admin UI needs to render toggles/plan selectors without
    // hardcoding the feature list — keeps the frontend in step with the backend.
    meta: asyncHandler(async (_req, res) => {
      // presets let the UI show each user's EFFECTIVE feature state (plan ⊕ override)
      // and, on save, store only real overrides (values differing from the plan).
      res.json({ features: FEATURES, plans: Object.keys(FEATURE_PRESETS), presets: FEATURE_PRESETS });
    }),

    list: asyncHandler(async (req, res) => {
      res.json(await listUsers(db, req.validatedQuery as AdminListQueryInput));
    }),

    get: asyncHandler<{ id: string }>(async (req, res) => {
      res.json({ user: await getUser(db, req.params.id) });
    }),

    update: asyncHandler<{ id: string }, unknown, AdminUpdateUserInput>(async (req, res) => {
      const user = await updateUser(db, {
        id: req.params.id,
        adminId: req.adminId as string, // always set by requireAdmin upstream
        patch: req.body,
      });
      res.json({ user });
    }),

    remove: asyncHandler<{ id: string }>(async (req, res) => {
      await deleteUser(db, { id: req.params.id, adminId: req.adminId as string });
      res.json({ ok: true });
    }),
  };
}

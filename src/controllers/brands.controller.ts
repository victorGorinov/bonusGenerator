import type { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import { ValidationError } from '../errors/ValidationError.js';
import { BrandCreateSchema, BrandUpdateSchema } from '../validation/brand.schema.js';
import { ProfileUpdateSchema } from '../validation/profile.schema.js';
import { getUserAccessById } from '../use-cases/Auth.js';
import { resolveLimits } from '../domain/auth/access.js';
import { listBrands, createBrand, updateBrand, deleteBrand } from '../use-cases/Brands.js';
import { getProfile, updateProfile } from '../use-cases/Profile.js';

interface Deps { db: Pool }

// requireAuth + requireWorkspace run before these, so both are always set.
function workspaceId(req: import('express').Request): string {
  if (!req.workspaceId) throw new AppError('Workspace not resolved', 500, 'INTERNAL_ERROR');
  return req.workspaceId;
}
function userId(req: import('express').Request): string {
  if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  return req.user.id;
}

// The quota is read from the DB on every create — never from the JWT — so an
// admin changing a user's plan or limits applies on the user's next request
// (same discipline as requireFeature).
async function brandLimit(db: Pool, uid: string): Promise<number> {
  const row = await getUserAccessById(db, uid);
  return resolveLimits(row).brands;
}

// Infinity can't be JSON-encoded (stringifies to null) — an unlimited quota
// travels as -1 and the frontend treats <0 as "no cap".
function wire(limit: number): number {
  return Number.isFinite(limit) ? limit : -1;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A non-UUID :id would make Postgres throw `invalid input syntax for type uuid`
// (a 500) for what is really just "no such brand" — answer 404 before querying.
function brandId(raw: string): string {
  if (!UUID_RE.test(raw)) throw new AppError('Brand not found', 404, 'NOT_FOUND');
  return raw;
}

export function createBrandsController({ db }: Deps) {
  return {
    // GET /api/brands → the workspace's brands plus the quota state, so the UI
    // can render "2 of 3 used" and disable "Add" without a second round-trip.
    list: asyncHandler(async (req, res) => {
      const [brands, limit] = await Promise.all([
        listBrands(db, workspaceId(req)),
        brandLimit(db, userId(req)),
      ]);
      res.json({ brands, limit: wire(limit), used: brands.length });
    }),

    create: asyncHandler(async (req, res) => {
      const parsed = BrandCreateSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.flatten());
      const limit = await brandLimit(db, userId(req));
      const brand = await createBrand(db, { workspaceId: workspaceId(req), limit, input: parsed.data });
      res.status(201).json({ brand });
    }),

    update: asyncHandler<{ id: string }>(async (req, res) => {
      const parsed = BrandUpdateSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.flatten());
      const brand = await updateBrand(db, {
        workspaceId: workspaceId(req), id: brandId(req.params.id), patch: parsed.data,
      });
      res.json({ brand });
    }),

    remove: asyncHandler<{ id: string }>(async (req, res) => {
      await deleteBrand(db, { workspaceId: workspaceId(req), id: brandId(req.params.id) });
      res.json({ ok: true });
    }),

    // GET/PATCH /api/brands/../profile — account-level, no workspace involved.
    profile: asyncHandler(async (req, res) => {
      res.json({ profile: await getProfile(db, userId(req)) });
    }),

    saveProfile: asyncHandler(async (req, res) => {
      const parsed = ProfileUpdateSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.flatten());
      res.json({ profile: await updateProfile(db, userId(req), parsed.data) });
    }),
  };
}

import { z } from 'zod';
import { FEATURES, FEATURE_PRESETS } from '../config/features.js';

// Per-user feature overrides: a partial map of known features → boolean.
// Unknown keys are rejected so a typo can't silently create a dead flag.
const FeatureOverridesSchema = z
  .object(
    FEATURES.reduce((shape, f) => {
      shape[f] = z.boolean();
      return shape;
    }, {} as Record<string, z.ZodBoolean>),
  )
  .partial()
  .strict();

const PLAN_KEYS = Object.keys(FEATURE_PRESETS) as [string, ...string[]];

export const AdminUpdateUserSchema = z
  .object({
    role:     z.enum(['user', 'admin']).optional(),
    status:   z.enum(['active', 'disabled']).optional(),
    plan:     z.enum(PLAN_KEYS).optional(),
    features: FeatureOverridesSchema.optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'No fields to update' });

export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;

// GET /api/admin/users query params (parsed off req.query, coerced from strings).
export const AdminListQuerySchema = z.object({
  q:      z.string().trim().max(200).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminListQueryInput = z.infer<typeof AdminListQuerySchema>;

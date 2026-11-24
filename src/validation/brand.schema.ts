import { z } from 'zod';

// A brand's `data` is the set of tool inputs that stay constant for an operator.
// Deliberately a WHITELIST rather than a free-form JSONB blob (unlike saved
// items): these values are read back into every generator form, so an unknown
// key would silently do nothing and a wrong-typed one would poison a form field.
// Adding a field = one line here + one line in the frontend prefill map.
//
// Every field is optional — a brand may be filled in gradually, and a missing
// field simply means "no default, use the tool's own".
export const BrandDataSchema = z.object({
  // Where the brand operates. `geo` is a country key (GEO_CFG / geo-data.js);
  // region + license are derived from it on the client, so they aren't stored.
  geo:      z.enum(['de', 'fr', 'es', 'it', 'nl', 'dk', 'uk', 'ru', 'kz', 'mn', 'us', 'br', 'mx', 'co', 'ar', 'pe', 'cl', 'iq', 'ly', 'sy', 'ae']).optional(),
  // Display currency preference — 'local' (region currency) or 'usd'.
  curMode:  z.enum(['local', 'usd']).optional(),
  // Default audience.
  segment:  z.enum(['new', 'mid', 'vip']).optional(),
  plat:     z.enum(['both', 'mobile', 'desk']).optional(),
  // Scale of the operation. Ranges mirror the tool schemas (generate/loyalty/
  // tournament) so a stored brand can never push a form outside its own bounds.
  players:  z.coerce.number().int().min(100).max(200_000).optional(),
  avgdep:   z.coerce.number().min(1).max(100_000).optional(),
  arpu:     z.coerce.number().min(1).max(100_000).optional(),
  rtp:      z.coerce.number().min(50).max(99.9).optional(),
  // Game providers the brand actually has integrated — filters game recommendations.
  providers: z.array(z.string().trim().min(1).max(60)).max(60).optional(),
  // Free-form context, shown in the profile UI only (never sent to a tool).
  siteUrl:  z.string().trim().max(200).optional(),
  notes:    z.string().trim().max(1000).optional(),
}).strict();

export type BrandData = z.infer<typeof BrandDataSchema>;

const NameSchema = z.string().trim().min(1).max(80);

export const BrandCreateSchema = z.object({
  name:      NameSchema,
  data:      BrandDataSchema.optional(),
  isDefault: z.boolean().optional(),
});
export type BrandCreateInput = z.infer<typeof BrandCreateSchema>;

// PATCH — every field optional, but at least one must be present so an empty
// body can't masquerade as a successful update.
export const BrandUpdateSchema = z.object({
  name:      NameSchema.optional(),
  data:      BrandDataSchema.optional(),
  isDefault: z.literal(true).optional(),   // only setting a default makes sense; clearing is done by defaulting another
}).refine(
  (v) => v.name !== undefined || v.data !== undefined || v.isDefault !== undefined,
  { message: 'No fields to update' },
);
export type BrandUpdateInput = z.infer<typeof BrandUpdateSchema>;

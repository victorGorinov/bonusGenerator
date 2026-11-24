import { z } from 'zod';

// Account profile — descriptive only, never access-related. Kept in its own
// JSONB column (users.profile) so a profile edit can't touch features/limits/plan.
export const ProfileUpdateSchema = z.object({
  // Display name lives in the users.name column, not in the JSONB blob.
  name:     z.string().trim().min(1).max(80).optional(),
  company:  z.string().trim().max(120).optional(),
  position: z.string().trim().max(120).optional(),
  timezone: z.string().trim().max(60).optional(),
}).strict().refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

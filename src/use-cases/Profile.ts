import type { Pool } from 'pg';
import { AppError } from '../errors/AppError.js';
import type { ProfileUpdateInput } from '../validation/profile.schema.js';

export interface ProfileView {
  id:      string;
  name:    string;
  email:   string;
  plan:    string;
  role:    string;
  profile: Record<string, unknown>;
}

const COLS = 'id, name, email, plan, role, profile';

export async function getProfile(db: Pool, userId: string): Promise<ProfileView> {
  const res = await db.query<ProfileView>(`SELECT ${COLS} FROM users WHERE id = $1`, [userId]);
  const row = res.rows[0];
  if (!row) throw new AppError('User not found', 404, 'NOT_FOUND');
  return { ...row, profile: row.profile ?? {} };
}

/**
 * Patch the account profile. `name` goes to its own column; the rest merge into
 * the profile JSONB (`||`), so sending only `company` leaves timezone intact —
 * the opposite of brand `data`, which is replaced wholesale by a full form submit.
 */
export async function updateProfile(
  db: Pool,
  userId: string,
  patch: ProfileUpdateInput,
): Promise<ProfileView> {
  const { name, ...blob } = patch;
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (name !== undefined) { sets.push(`name = $${i++}`); values.push(name); }
  if (Object.keys(blob).length) { sets.push(`profile = profile || $${i++}::jsonb`); values.push(JSON.stringify(blob)); }
  if (!sets.length) return getProfile(db, userId);
  values.push(userId);

  const res = await db.query<ProfileView>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${COLS}`,
    values,
  );
  const row = res.rows[0];
  if (!row) throw new AppError('User not found', 404, 'NOT_FOUND');
  return { ...row, profile: row.profile ?? {} };
}

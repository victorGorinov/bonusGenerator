// Postgres-backed persistence for the AI guardrails (ai_spend + ai_user_usage).
// On Vercel Fluid Compute the process is ephemeral and multiple instances run
// concurrently, so counters MUST live in the DB — an in-memory total would neither
// survive a redeploy nor be shared across instances.
//
// The middleware depends on the AiUsageStore interface (injectable → tests pass a
// fake, no DB needed). recordGlobalSpend is also called directly by the Anthropic
// provider (the single funnel where the real cost_usd is known).

import type { Pool } from 'pg';
import { pool as defaultPool } from '../../db/client.js';

export interface UserUsage { today: number; total: number }
export interface SpendResult { total: number; crossedAlert: boolean }

export interface AiUsageStore {
  getGlobalSpend(): Promise<number>;
  getUserUsage(userId: string): Promise<UserUsage>;
  bumpUser(userId: string): Promise<void>;
  // cost = USD for one AI call; alertAt = AI_BUDGET_ALERT_USD. Atomically adds the
  // cost and returns the new total plus whether THIS call is the one that first
  // crossed the alert threshold (so the caller warns exactly once).
  recordGlobalSpend(cost: number, alertAt: number): Promise<SpendResult>;
}

export function createPgUsageStore(pool: Pool = defaultPool): AiUsageStore {
  return {
    async getGlobalSpend(): Promise<number> {
      const { rows } = await pool.query<{ cost_usd: string }>(
        'SELECT cost_usd FROM ai_spend WHERE id = 1',
      );
      return rows[0] ? Number(rows[0].cost_usd) : 0;
    },

    async getUserUsage(userId: string): Promise<UserUsage> {
      const { rows } = await pool.query<{ today: string; total: string }>(
        `SELECT
           COALESCE(SUM(calls) FILTER (WHERE day = CURRENT_DATE), 0) AS today,
           COALESCE(SUM(calls), 0)                                   AS total
         FROM ai_user_usage WHERE user_id = $1`,
        [userId],
      );
      return { today: Number(rows[0]?.today ?? 0), total: Number(rows[0]?.total ?? 0) };
    },

    async bumpUser(userId: string): Promise<void> {
      await pool.query(
        `INSERT INTO ai_user_usage (user_id, day, calls) VALUES ($1, CURRENT_DATE, 1)
         ON CONFLICT (user_id, day)
         DO UPDATE SET calls = ai_user_usage.calls + 1, updated_at = NOW()`,
        [userId],
      );
    },

    async recordGlobalSpend(cost: number, alertAt: number): Promise<SpendResult> {
      // Single atomic UPSERT: add the cost to the singleton row, self-healing if the
      // row is somehow missing (INSERT seeds it) so the kill-switch can never fail
      // open on a fresh/empty ai_spend. RETURNING sees the NEW cost_usd, so
      // `cost_usd - $1` is the pre-call total; `crossed` is true only on the single
      // call that takes the running total from below the alert to at/over it → we
      // warn exactly once (value-based, so it survives process restarts).
      const { rows } = await pool.query<{ cost_usd: string; crossed: boolean }>(
        `INSERT INTO ai_spend (id, cost_usd, calls) VALUES (1, $1, 1)
         ON CONFLICT (id) DO UPDATE
           SET cost_usd    = ai_spend.cost_usd + $1,
               calls       = ai_spend.calls + 1,
               updated_at  = NOW()
         RETURNING cost_usd,
                   (cost_usd - $1 < $2) AND (cost_usd >= $2) AS crossed`,
        [cost, alertAt],
      );
      const total = rows[0] ? Number(rows[0].cost_usd) : 0;
      return { total, crossedAlert: Boolean(rows[0]?.crossed) };
    },
  };
}

// Prod singleton over the default pool.
export const pgUsageStore = createPgUsageStore();

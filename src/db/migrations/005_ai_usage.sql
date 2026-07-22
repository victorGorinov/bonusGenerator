-- Beta AI cost guardrails — see CLAUDE.md "AI cost guardrails".
-- Applied via: tsx scripts/migrate.ts src/db/migrations/005_ai_usage.sql
--
-- Two tables:
--   ai_spend       — single all-time row (id=1) accumulating real cost_usd across
--                    every AI call (guest or user). Drives the $20 kill-switch and
--                    the $12 alert. The alert fires exactly once, decided at write
--                    time from the crossing of the running total (see store.ts) —
--                    no persisted flag needed. recordGlobalSpend UPSERTs, so a
--                    missing row self-heals rather than failing the cap open.
--   ai_user_usage  — per-user, per-(UTC-)day AI call counter. Drives the per-tester
--                    quotas: today's row → daily limit; SUM over rows → total limit.
-- Both are tiny at beta scale (5 granted testers). Counts are atomic UPSERTs.

CREATE TABLE IF NOT EXISTS ai_spend (
  id         INT          PRIMARY KEY DEFAULT 1,
  cost_usd   NUMERIC(12,6) NOT NULL DEFAULT 0,
  calls      INT          NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_spend_singleton CHECK (id = 1)
);
INSERT INTO ai_spend (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ai_user_usage (
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        DATE        NOT NULL,
  calls      INT         NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS idx_ai_user_usage_user ON ai_user_usage (user_id);

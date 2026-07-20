-- Competitor Comparison (feature: competitorComparison) — see tasks/competitor-comparison/.
-- Applied via: tsx scripts/migrate.ts src/db/migrations/004_competitor_comparisons.sql
--
-- Same uniform per-workspace {client_id, data} shape as the six saved_items
-- tables from 002 — the SavedItems generic list/upsert/delete layer handles it
-- with no special-casing (entity key 'competitor-comparisons').

CREATE TABLE IF NOT EXISTS competitor_comparisons (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id    TEXT        NOT NULL,
  data         JSONB       NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_competitor_comparisons_ws
  ON competitor_comparisons (workspace_id, created_at DESC);

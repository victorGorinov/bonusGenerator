-- Brand profiles (user profile feature) — see CLAUDE.md "Brand profiles".
-- Applied via: tsx scripts/migrate.ts src/db/migrations/006_brands.sql
--
-- A brand is a reusable set of the input parameters every tool asks for
-- (geo/license, currency mode, player base, avg deposit, ARPU, RTP, platform,
-- connected providers). Selecting a brand in any form seeds those fields as
-- DEFAULTS — the user can still edit every one of them.
--
-- Per-workspace like the saved_items tables from 002, but NOT part of the
-- generic {client_id, data} SavedItems layer: brands are quota-limited by plan
-- (PLAN_LIMITS in src/config/features.ts) and need their own create-time guard,
-- so they get a dedicated use-case (src/use-cases/Brands.ts).

CREATE TABLE IF NOT EXISTS brands (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  is_default   BOOLEAN     NOT NULL DEFAULT FALSE,
  data         JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_ws ON brands (workspace_id, created_at);

-- Case-insensitive name uniqueness inside a workspace: "Casino X" and "casino x"
-- are the same brand to a human, and the picker would show two identical rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_ws_name
  ON brands (workspace_id, lower(name));

-- At most ONE default brand per workspace, enforced by the DB rather than by
-- application ordering (setDefault clears the old flag in the same transaction).
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_ws_default
  ON brands (workspace_id) WHERE is_default;

-- Account profile (company / role / timezone) — free-form JSONB, whitelisted in
-- src/validation/profile.schema.ts. Separate from `features`/`limits` so a
-- profile edit can never touch access control.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}';

-- Per-user NUMERIC limit overrides, e.g. {"brands": 5}. The numeric sibling of
-- the boolean `features` column: same precedence (admin → override → plan).
ALTER TABLE users ADD COLUMN IF NOT EXISTS limits  JSONB NOT NULL DEFAULT '{}';

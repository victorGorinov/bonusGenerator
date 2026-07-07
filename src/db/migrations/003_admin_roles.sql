-- Phase 1b (admin / roles / feature-access) — see CLAUDE.md "Admin & access control".
-- Applied manually: psql $DATABASE_URL -f src/db/migrations/003_admin_roles.sql
--
-- Adds role-based admin, an enable/disable status, a tariff-plan slot, and a
-- per-user feature-override map. Effective access = planFeatures(plan) ⊕ features
-- (see src/config/features.ts + src/domain/auth/access.ts). All columns have
-- defaults, so existing rows keep full access (plan 'free' == everything-on).

ALTER TABLE users ADD COLUMN IF NOT EXISTS role     TEXT  NOT NULL DEFAULT 'user';   -- 'admin' | 'user'
ALTER TABLE users ADD COLUMN IF NOT EXISTS status   TEXT  NOT NULL DEFAULT 'active'; -- 'active' | 'disabled'
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan     TEXT  NOT NULL DEFAULT 'free';   -- tariff preset key
ALTER TABLE users ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{}';     -- per-user overrides { feature: bool }

-- Admin listing filters/sorts by these.
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- Phase 1 (auth core) — see AUTH_IMPLEMENTATION_PLAN.md §3.
-- Applied manually: psql $DATABASE_URL -f src/db/migrations/001_initial.sql
-- saved_configs / ai_campaigns / saved_tournaments / saved_loyalty_programs /
-- calendar_events / calendar_templates are Phase 2 — not created here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Workspace: 1:1 with user in this phase (owner_id unique).
-- Kept as a separate table so a future multi-user phase needs no schema migration.
CREATE TABLE workspaces (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  owner_id   UUID        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2 (server-side persistence) — see AUTH_IMPLEMENTATION_PLAN.md §3.
-- Applied manually: psql $DATABASE_URL -f src/db/migrations/002_saved_items.sql
--
-- Six per-workspace data tables replacing the localStorage keys:
--   cfgSaved → saved_configs, be_campaigns → ai_campaigns,
--   savedTournaments → saved_tournaments, savedLoyaltyPrograms → saved_loyalty_programs,
--   rc_campaigns → calendar_events, rc_templates → calendar_templates.
--
-- Uniform shape across all six (deviates from the plan's per-column saved_configs,
-- which was pointless since cfgSaved has no read path): the frontend record is
-- stored whole in `data` JSONB and its own client-generated id is `client_id`.
-- The client id stays the identity everywhere, so:
--   * the browser needs no server-id reconciliation (localStorage stays the cache),
--   * one-time localStorage→API migration is idempotent via UNIQUE(workspace_id, client_id).

CREATE OR REPLACE FUNCTION _create_saved_table(tbl TEXT) RETURNS void AS $$
BEGIN
  EXECUTE format($f$
    CREATE TABLE IF NOT EXISTS %I (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      client_id    TEXT        NOT NULL,
      data         JSONB       NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (workspace_id, client_id)
    )$f$, tbl);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (workspace_id, created_at DESC)',
                 'idx_' || tbl || '_ws', tbl);
END;
$$ LANGUAGE plpgsql;

SELECT _create_saved_table('saved_configs');
SELECT _create_saved_table('ai_campaigns');
SELECT _create_saved_table('saved_tournaments');
SELECT _create_saved_table('saved_loyalty_programs');
SELECT _create_saved_table('calendar_events');
SELECT _create_saved_table('calendar_templates');

DROP FUNCTION _create_saved_table(TEXT);

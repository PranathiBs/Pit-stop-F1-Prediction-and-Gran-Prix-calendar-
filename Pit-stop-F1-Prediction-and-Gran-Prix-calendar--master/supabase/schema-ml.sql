-- ============================================================
--  Pit Stop — COMPREHENSIVE SCHEMA FIX
--  Run this in Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- ─── 0. PREREQUISITES ──────────────────────────────────────────
-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. ml_predictions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ml_predictions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year            INT NOT NULL,
  round           INT,
  gp_name         TEXT NOT NULL,
  driver_code     TEXT NOT NULL,
  predicted_pos   INT NOT NULL,
  confidence      FLOAT,
  base_pace       FLOAT,
  deg_coef        FLOAT,
  model_version   TEXT DEFAULT 'rf_v1',
  features        JSONB,
  actual_pos      INT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ml_predictions_unique UNIQUE (year, gp_name, driver_code)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ml_pred_year_gp ON ml_predictions(year, gp_name);
CREATE INDEX IF NOT EXISTS idx_ml_pred_driver  ON ml_predictions(driver_code);

-- Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply Trigger
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ml_predictions_updated') THEN
    CREATE TRIGGER trg_ml_predictions_updated
      BEFORE UPDATE ON ml_predictions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- RLS Policies (Idempotent)
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ml_predictions_read" ON ml_predictions;
CREATE POLICY "ml_predictions_read" ON ml_predictions FOR SELECT USING (true);
DROP POLICY IF EXISTS "ml_predictions_write" ON ml_predictions;
CREATE POLICY "ml_predictions_write" ON ml_predictions FOR ALL USING (true);


-- ─── 2. driver_consistency ────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_consistency (
  driver_id         TEXT PRIMARY KEY,
  driver_code       TEXT NOT NULL,
  driver_name       TEXT NOT NULL,
  constructor_id    TEXT,
  constructor_name  TEXT,
  season            INT NOT NULL DEFAULT 2025,
  avg_position      FLOAT,
  consistency_score FLOAT,
  wins              INT DEFAULT 0,
  podiums           INT DEFAULT 0,
  dnfs              INT DEFAULT 0,
  races             INT DEFAULT 0,
  recent_form       INT[] DEFAULT ARRAY[]::INT[],
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE driver_consistency ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dc_read" ON driver_consistency;
CREATE POLICY "dc_read" ON driver_consistency FOR SELECT USING (true);
DROP POLICY IF EXISTS "dc_write" ON driver_consistency;
CREATE POLICY "dc_write" ON driver_consistency FOR ALL USING (true);


-- ─── 3. live_session_cache ────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_session_cache (
  id           INT DEFAULT 1 PRIMARY KEY,
  session_data JSONB,
  drivers_data JSONB,
  is_active    BOOLEAN DEFAULT FALSE,
  fetched_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO live_session_cache (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE live_session_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "live_cache_read" ON live_session_cache;
CREATE POLICY "live_cache_read" ON live_session_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "live_cache_write" ON live_session_cache;
CREATE POLICY "live_cache_write" ON live_session_cache FOR ALL USING (true);


-- ─── 4. race_results_history ──────────────────────────────────
--  This ensures that IF the table already exists, it gets the new columns
CREATE TABLE IF NOT EXISTS race_results_history (
  id              BIGSERIAL PRIMARY KEY,
  year            INT NOT NULL,
  round           INT NOT NULL,
  race_name       TEXT NOT NULL
);

-- Add missing columns individually if table existed partially
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS driver_code TEXT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS constructor_id TEXT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS constructor_name TEXT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS position INT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS points FLOAT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Finished';
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS winner_name TEXT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS p2_name TEXT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS p3_name TEXT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS winner_pts INT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS p2_pts INT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS p3_pts INT;
ALTER TABLE race_results_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rr_unique') THEN
    ALTER TABLE race_results_history ADD CONSTRAINT rr_unique UNIQUE (year, round, driver_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rr_year_round  ON race_results_history(year, round);
CREATE INDEX IF NOT EXISTS idx_rr_driver_code ON race_results_history(driver_code);

ALTER TABLE race_results_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rr_read" ON race_results_history;
CREATE POLICY "rr_read" ON race_results_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "rr_write" ON race_results_history;
CREATE POLICY "rr_write" ON race_results_history FOR ALL USING (true);

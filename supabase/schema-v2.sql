-- Pit Stop F1 App - Additional Tables
-- Run this in Supabase SQL Editor after running the base schema.sql
-- These tables support the new features: favorite circuits & user predictions

-- Favorite Circuits Table (no auth required)
CREATE TABLE IF NOT EXISTS favorite_circuits (
  id BIGSERIAL PRIMARY KEY,
  circuit_id TEXT UNIQUE NOT NULL,
  circuit_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_favorite_circuits ON favorite_circuits(circuit_id);

-- User Predictions Table (no auth required for now)
CREATE TABLE IF NOT EXISTS user_predictions (
  id BIGSERIAL PRIMARY KEY,
  circuit_id TEXT NOT NULL,
  race_name TEXT NOT NULL,
  predicted_winner TEXT,
  predicted_podium JSONB,
  predicted_weather TEXT,
  tyre_strategy_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_predictions_circuit ON user_predictions(circuit_id);

-- Enable RLS
ALTER TABLE favorite_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can read/write (no auth for now)
CREATE POLICY "Favorite circuits readable by all" ON favorite_circuits FOR SELECT USING (true);
CREATE POLICY "Favorite circuits writable by all" ON favorite_circuits FOR INSERT WITH CHECK (true);
CREATE POLICY "Favorite circuits deletable by all" ON favorite_circuits FOR DELETE USING (true);

CREATE POLICY "User predictions readable by all" ON user_predictions FOR SELECT USING (true);
CREATE POLICY "User predictions writable by all" ON user_predictions FOR INSERT WITH CHECK (true);

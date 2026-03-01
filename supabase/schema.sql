-- Pit Stop F1 Prediction App - Supabase Schema
-- Run this in Supabase SQL Editor to set up the database

-- Weather Cache Table
CREATE TABLE IF NOT EXISTS weather_cache (
  id BIGSERIAL PRIMARY KEY,
  circuit_id TEXT UNIQUE NOT NULL,
  weather_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_weather_cache_circuit ON weather_cache(circuit_id);

-- Tyre Strategies Table  
CREATE TABLE IF NOT EXISTS tyre_strategies (
  id BIGSERIAL PRIMARY KEY,
  circuit_id TEXT NOT NULL,
  weather_condition TEXT NOT NULL,
  track_temp DECIMAL,
  air_temp DECIMAL,
  strategy JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tyre_strategies_circuit ON tyre_strategies(circuit_id);

-- User Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  race_round INTEGER NOT NULL,
  season TEXT NOT NULL,
  predicted_winner TEXT,
  predicted_podium JSONB,
  predicted_strategy JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, race_round, season)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);

-- User Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  favorite_type TEXT NOT NULL, -- 'driver', 'team', 'circuit'
  favorite_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, favorite_type, favorite_id)
);

-- Enable Row Level Security
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tyre_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Policies: Weather cache is readable by all, writable by authenticated
CREATE POLICY "Weather cache is readable by all" ON weather_cache
  FOR SELECT USING (true);

CREATE POLICY "Weather cache is writable by authenticated" ON weather_cache
  FOR ALL USING (true);

-- Policies: Tyre strategies are readable by all
CREATE POLICY "Tyre strategies are readable by all" ON tyre_strategies
  FOR SELECT USING (true);

CREATE POLICY "Tyre strategies are writable by all" ON tyre_strategies
  FOR INSERT WITH CHECK (true);

-- Policies: Predictions are user-scoped
CREATE POLICY "Users can view their own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies: Favorites are user-scoped
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

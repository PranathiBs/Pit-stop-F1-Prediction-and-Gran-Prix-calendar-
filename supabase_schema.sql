-- F1 Pit Stop: Full Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Race Results History (Core Data)
CREATE TABLE IF NOT EXISTS public.race_results_history (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    round INTEGER NOT NULL,
    race_name TEXT NOT NULL,
    driver_code TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    constructor_id TEXT,
    constructor_name TEXT,
    position INTEGER,
    points FLOAT DEFAULT 0,
    status TEXT,
    winner_name TEXT,
    p2_name TEXT,
    p3_name TEXT,
    winner_pts INTEGER,
    p2_pts INTEGER,
    p3_pts INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, round, driver_code)
);

-- 2. Driver Consistency Scores (Calculated Data)
CREATE TABLE IF NOT EXISTS public.driver_consistency (
    id BIGSERIAL PRIMARY KEY,
    driver_id TEXT UNIQUE NOT NULL,
    driver_code TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    constructor_id TEXT,
    constructor_name TEXT,
    season INTEGER,
    avg_position FLOAT,
    consistency_score FLOAT,
    wins INTEGER DEFAULT 0,
    podiums INTEGER DEFAULT 0,
    dnfs INTEGER DEFAULT 0,
    races INTEGER DEFAULT 0,
    recent_form INTEGER[], -- Array of last 10 positions
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ML Predictions (Strategy/ML Engine)
CREATE TABLE IF NOT EXISTS public.ml_predictions (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    gp_name TEXT NOT NULL,
    driver_code TEXT NOT NULL,
    predicted_pos INTEGER,
    confidence FLOAT,
    base_pace FLOAT,
    deg_coef FLOAT,
    model_version TEXT DEFAULT 'rf_v2',
    features JSONB, -- Store parameters like track temp, rain prob
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, gp_name, driver_code)
);

-- 4. Live Session Cache (Real-time Efficiency)
CREATE TABLE IF NOT EXISTS public.live_session_cache (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Only one row for global cache
    session_data JSONB,
    drivers_data JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional but recommended
-- For development, you can keep them open or add policies
ALTER TABLE public.race_results_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_consistency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_session_cache ENABLE ROW LEVEL SECURITY;

-- Creating public read-only policies
CREATE POLICY "Allow public read-only access" ON public.race_results_history FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access" ON public.driver_consistency FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access" ON public.ml_predictions FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access" ON public.live_session_cache FOR SELECT USING (true);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is configured
export function isSupabaseReady(): boolean {
  return supabase !== null;
}

// Types for our database
export interface WeatherCache {
  id?: number;
  circuit_id: string;
  weather_data: Record<string, unknown>;
  fetched_at: string;
}

export interface TyreStrategy {
  id?: number;
  circuit_id: string;
  weather_condition: string;
  track_temp: number;
  air_temp: number;
  strategy: StrategyOption[];
  created_at?: string;
}

export interface StrategyOption {
  stint: number;
  compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
  laps: number;
  pit_lap: number | null;
}

export interface UserPrediction {
  id?: number;
  circuit_id: string;
  race_name: string;
  predicted_winner: string;
  predicted_podium: string[];
  predicted_weather: string;
  tyre_strategy_id?: number;
  created_at?: string;
}

export interface FavoriteCircuit {
  id?: number;
  circuit_id: string;
  circuit_name: string;
  created_at?: string;
}

export interface RaceResultHistory {
  id?: string;
  year: number;
  round: number;
  race_name: string;
  winner_name: string;
  p2_name: string;
  p3_name: string;
  winner_pts?: number;
  p2_pts?: number;
  p3_pts?: number;
}

// ===== WEATHER CACHE =====

export async function cacheWeatherData(circuitId: string, data: Record<string, unknown>) {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('weather_cache')
      .upsert({
        circuit_id: circuitId,
        weather_data: data,
        fetched_at: new Date().toISOString()
      }, { onConflict: 'circuit_id' });

    if (error) console.error('Error caching weather:', error.message);
  } catch (e) {
    console.error('Supabase weather cache error:', e);
  }
}

export async function getCachedWeather(circuitId: string): Promise<WeatherCache | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('weather_cache')
      .select('*')
      .eq('circuit_id', circuitId)
      .single();

    if (error) return null;

    // Check if cache is older than 1 hour
    if (data) {
      const cachedTime = new Date(data.fetched_at).getTime();
      const now = Date.now();
      if (now - cachedTime > 3600000) return null; // expired
    }

    return data;
  } catch {
    return null;
  }
}

// ===== TYRE STRATEGIES =====

export async function saveTyreStrategy(strategy: TyreStrategy) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('tyre_strategies')
      .insert(strategy)
      .select()
      .single();

    if (error) console.error('Error saving strategy:', error.message);
    return data;
  } catch (e) {
    console.error('Supabase strategy save error:', e);
    return null;
  }
}

export async function getRecentStrategies(circuitId: string, limit = 5) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('tyre_strategies')
      .select('*')
      .eq('circuit_id', circuitId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// ===== USER PREDICTIONS =====

export async function savePrediction(prediction: UserPrediction) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_predictions')
      .insert(prediction)
      .select()
      .single();

    if (error) console.error('Error saving prediction:', error.message);
    return data;
  } catch (e) {
    console.error('Supabase prediction save error:', e);
    return null;
  }
}

export async function getUserPredictions(limit = 10) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// ===== FAVORITE CIRCUITS =====

export async function toggleFavoriteCircuit(circuitId: string, circuitName: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorite_circuits')
      .select('id')
      .eq('circuit_id', circuitId)
      .single();

    if (existing) {
      // Remove favorite
      await supabase.from('favorite_circuits').delete().eq('circuit_id', circuitId);
      return false;
    } else {
      // Add favorite
      await supabase.from('favorite_circuits').insert({ circuit_id: circuitId, circuit_name: circuitName });
      return true;
    }
  } catch {
    return false;
  }
}

export async function getFavoriteCircuits(): Promise<FavoriteCircuit[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('favorite_circuits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function isFavoriteCircuit(circuitId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data } = await supabase
      .from('favorite_circuits')
      .select('id')
      .eq('circuit_id', circuitId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// ===== RACE HISTORY SYNC =====

export async function syncRaceHistory(results: any[]) {
  if (!supabase || !results.length) return;

  try {
    const historyData = results.map(race => ({
      year: parseInt(race.season),
      round: parseInt(race.round),
      race_name: race.raceName,
      winner_name: race.Results?.[0] ? `${race.Results[0].Driver.givenName} ${race.Results[0].Driver.familyName}` : 'N/A',
      p2_name: race.Results?.[1] ? `${race.Results[1].Driver.givenName} ${race.Results[1].Driver.familyName}` : 'N/A',
      p3_name: race.Results?.[2] ? `${race.Results[2].Driver.givenName} ${race.Results[2].Driver.familyName}` : 'N/A',
      winner_pts: race.Results?.[0] ? parseInt(race.Results[0].points) : 25,
      p2_pts: race.Results?.[1] ? parseInt(race.Results[1].points) : 18,
      p3_pts: race.Results?.[2] ? parseInt(race.Results[2].points) : 15,
    }));

    const { error } = await supabase
      .from('race_results_history')
      .upsert(historyData, { onConflict: 'year,round' });

    if (error) console.warn('Supabase sync warning:', error.message);
  } catch (e) {
    console.error('Supabase sync error:', e);
  }
}

// ===== ML PREDICTIONS =====

export interface MLPredictionRow {
  id?: string;
  year: number;
  round?: number;
  gp_name: string;
  driver_code: string;
  predicted_pos: number;
  confidence?: number;
  base_pace?: number;
  deg_coef?: number;
  model_version?: string;
  features?: Record<string, number>;
  actual_pos?: number;
  created_at?: string;
}

export async function getMLPredictions(year: number, gp: string): Promise<MLPredictionRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('ml_predictions')
      .select('*')
      .eq('year', year)
      .eq('gp_name', gp)
      .order('predicted_pos', { ascending: true });
    if (error) return [];
    return data || [];
  } catch { return []; }
}

export async function upsertMLPredictions(rows: MLPredictionRow[]) {
  if (!supabase || !rows.length) return;
  try {
    const { error } = await supabase
      .from('ml_predictions')
      .upsert(rows, { onConflict: 'year,gp_name,driver_code' });
    if (error) console.warn('ML upsert warning:', error.message);
  } catch (e) { console.error('ML upsert error:', e); }
}

export async function updateActualResult(year: number, gp: string, driverCode: string, actualPos: number) {
  if (!supabase) return;
  try {
    await supabase
      .from('ml_predictions')
      .update({ actual_pos: actualPos })
      .eq('year', year)
      .eq('gp_name', gp)
      .eq('driver_code', driverCode);
  } catch (e) { console.error('updateActualResult error:', e); }
}

export async function getMLAccuracy(year: number): Promise<{ driver: string; predicted: number; actual: number; delta: number }[]> {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('ml_predictions')
      .select('driver_code, predicted_pos, actual_pos')
      .eq('year', year)
      .not('actual_pos', 'is', null);
    return (data || []).map((r: any) => ({
      driver: r.driver_code,
      predicted: r.predicted_pos,
      actual: r.actual_pos,
      delta: Math.abs(r.actual_pos - r.predicted_pos),
    }));
  } catch { return []; }
}

// ===== DRIVER CONSISTENCY (from Supabase) =====

export interface ConsistencyRow {
  driver_id: string;
  driver_code: string;
  driver_name: string;
  constructor_id?: string;
  constructor_name?: string;
  season: number;
  avg_position: number;
  consistency_score: number;
  wins: number;
  podiums: number;
  dnfs: number;
  races: number;
  recent_form: number[];
  updated_at?: string;
}

export async function getDriverConsistency(season?: number): Promise<ConsistencyRow[]> {
  if (!supabase) return [];
  try {
    let q = supabase.from('driver_consistency').select('*').order('consistency_score', { ascending: false });
    if (season) q = q.eq('season', season);
    const { data } = await q;
    return data || [];
  } catch { return []; }
}

// ===== LIVE SESSION CACHE =====

export async function getLiveCache() {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('live_session_cache')
      .select('*')
      .eq('id', 1)
      .single();
    if (!data?.fetched_at) return null;
    const ageMs = Date.now() - new Date(data.fetched_at).getTime();
    if (ageMs > 30_000) return null; // expired
    return data;
  } catch { return null; }
}

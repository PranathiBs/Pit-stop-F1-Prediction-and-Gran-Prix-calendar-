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

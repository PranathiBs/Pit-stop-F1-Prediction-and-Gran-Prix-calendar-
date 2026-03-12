/**
 * lib/ml-engine.ts
 * TypeScript client for all ML + Live + Supabase operations.
 * All calls go through Next.js API routes (server-side) — never directly to Python.
 */

export interface DriverPrediction {
    driver: string;
    predicted_pos: number;
    confidence: number;
    base_pace: number;
    deg_coef: number;
    features: Record<string, number>;
}

export interface MLResult {
    year: number;
    gp: string;
    model: string;
    version: string;
    weather: { temp: number; rain_prob: number };
    timestamp: string;
    from_cache?: boolean;
    predictions: DriverPrediction[];
    error?: string;
}

export interface LiveData {
    session: {
        session_name: string;
        session_type: string;
        location: string;
        country_name: string;
        date_start: string;
        date_end: string;
    } | null;
    drivers: Array<{
        driver_number: number;
        position: number;
        lap: number;
        gap: string;
        compound: string;
    }>;
    is_active: boolean;
    fetched_at: string;
    from_cache: boolean;
    cache_source: string;
    age_ms: number;
    error?: string;
}

export interface SyncResult {
    ok: boolean;
    year: number;
    races: number;
    results: number;
    drivers: number;
    log: string[];
    error?: string;
}

// ──────────────────────────────────────────────────────────────
//  getMLPrediction
//  Fetches ML race prediction from /api/ml/predict (server-cached)
// ──────────────────────────────────────────────────────────────
export async function getMLPrediction(
    year: number,
    gp: string,
    temp: number = 25,
    rain: number = 0,
): Promise<MLResult | null> {
    try {
        const params = new URLSearchParams({
            year: String(year),
            gp,
            temp: String(temp),
            rain: String(rain),
        });
        const res = await fetch(`/api/ml/predict?${params}`, {
            next: { revalidate: 0 },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
            return { year, gp, model: 'unavailable', version: '', weather: { temp, rain_prob: rain }, timestamp: new Date().toISOString(), predictions: [], error: err.error };
        }
        return await res.json();
    } catch (e) {
        console.error('[ml-engine] getMLPrediction error:', e);
        return null;
    }
}

// ──────────────────────────────────────────────────────────────
//  getLiveData
//  Fetches server-cached live OpenF1 data (30s TTL)
// ──────────────────────────────────────────────────────────────
export async function getLiveData(): Promise<LiveData | null> {
    try {
        const res = await fetch('/api/live', { next: { revalidate: 0 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('[ml-engine] getLiveData error:', e);
        return null;
    }
}

// ──────────────────────────────────────────────────────────────
//  triggerSync
//  Triggers /api/sync to refresh Supabase race data
// ──────────────────────────────────────────────────────────────
export async function triggerSync(year: number): Promise<SyncResult | null> {
    try {
        const res = await fetch(`/api/sync?year=${year}`, { next: { revalidate: 0 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('[ml-engine] triggerSync error:', e);
        return null;
    }
}

// ──────────────────────────────────────────────────────────────
//  LIVE POLL INTERVAL
// ──────────────────────────────────────────────────────────────
export const ML_POLL_INTERVAL_MS = 30_000;

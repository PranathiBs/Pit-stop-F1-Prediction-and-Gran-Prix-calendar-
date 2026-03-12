/**
 * /api/ml/predict
 * Server-side wrapper that calls the Python FastAPI ML backend,
 * saves results to Supabase, and returns the ranked driver grid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

// Service-role Supabase client (never exposed to browser)
const supa = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    )
    : null;

export interface DriverPrediction {
    driver: string;
    predicted_pos: number;
    confidence: number;
    base_pace: number;
    deg_coef: number;
    features: Record<string, number>;
}

export interface MLPredictionResult {
    year: number;
    gp: string;
    model: string;
    version: string;
    weather: { temp: number; rain_prob: number };
    timestamp: string;
    predictions: DriverPrediction[];
    from_cache?: boolean;
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const year = parseInt(searchParams.get('year') ?? '2025');
    const gp = searchParams.get('gp') ?? 'Bahrain';
    const temp = parseFloat(searchParams.get('temp') ?? '25');
    const rain = parseFloat(searchParams.get('rain') ?? '0');

    // Check Supabase cache first (< 5 min for same GP)
    if (supa) {
        try {
            const { data } = await supa
                .from('ml_predictions')
                .select('*')
                .eq('year', year)
                .eq('gp_name', gp)
                .order('predicted_pos', { ascending: true })
                .limit(20);

            if (data && data.length >= 5) {
                const latest = data[0];
                const ageMs = Date.now() - new Date(latest.created_at).getTime();
                const fiveMin = 5 * 60 * 1000;

                if (ageMs < fiveMin) {
                    return NextResponse.json({
                        year, gp,
                        model: latest.model_version ?? 'rf_v2',
                        version: latest.model_version ?? 'rf_v2',
                        weather: { temp, rain_prob: rain },
                        timestamp: latest.created_at,
                        from_cache: true,
                        predictions: data.map(r => ({
                            driver: r.driver_code,
                            predicted_pos: r.predicted_pos,
                            confidence: r.confidence ?? 0,
                            base_pace: r.base_pace ?? 0,
                            deg_coef: r.deg_coef ?? 0,
                            features: r.features ?? {},
                        })),
                    });
                }
            }
        } catch (e) {
            console.warn('[/api/ml/predict] Supabase cache read error:', e);
        }
    }

    // Call Python backend
    try {
        const url = `${PYTHON_BACKEND}/predict/race/${year}/${encodeURIComponent(gp)}?temp=${temp}&rain=${rain}`;
        const res = await fetch(url, { next: { revalidate: 0 } });

        if (!res.ok) {
            throw new Error(`Backend ${res.status}: ${await res.text()}`);
        }

        const data: MLPredictionResult = await res.json();

        // Upsert to Supabase (fire-and-forget)
        if (supa && data.predictions?.length) {
            const rows = data.predictions.map(p => ({
                year,
                gp_name: gp,
                driver_code: p.driver,
                predicted_pos: p.predicted_pos,
                confidence: p.confidence,
                base_pace: p.base_pace,
                deg_coef: p.deg_coef,
                model_version: data.version,
                features: p.features,
            }));

            supa.from('ml_predictions')
                .upsert(rows, { onConflict: 'year,gp_name,driver_code' })
                .then(({ error }) => {
                    if (error) console.warn('[Supabase] ML prediction upsert warning:', error.message);
                });
        }

        return NextResponse.json(data);

    } catch (err) {
        console.error('[/api/ml/predict] Error:', err);
        return NextResponse.json(
            { error: 'ML backend unavailable. Please ensure the Python engine is running.', details: String(err) },
            { status: 503 }
        );
    }
}

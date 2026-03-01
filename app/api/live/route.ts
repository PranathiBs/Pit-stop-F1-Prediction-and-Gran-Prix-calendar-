/**
 * /api/live
 * Server-side OpenF1 live data proxy.
 * Reads from Supabase live_session_cache (30s TTL).
 * Falls back to direct OpenF1 fetch when stale, then writes back.
 * Prevents browser CORS issues and client-side rate limiting.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OPENF1_BASE = 'https://api.openf1.org/v1';
const CACHE_TTL_MS = 30_000; // 30 seconds

const supa = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    )
    : null;

// In-process memory cache as first-layer defense
let memCache: { data: unknown; ts: number } = { data: null, ts: 0 };

async function openF1Get(endpoint: string): Promise<unknown[]> {
    try {
        const r = await fetch(`${OPENF1_BASE}${endpoint}`, { next: { revalidate: 0 } });
        return r.ok ? await r.json() : [];
    } catch {
        return [];
    }
}

export async function GET() {
    const now = Date.now();

    // 1️⃣  In-memory cache
    if (memCache.data && now - memCache.ts < CACHE_TTL_MS) {
        return NextResponse.json({ ...(memCache.data as object), from_cache: true, cache_source: 'memory', age_ms: now - memCache.ts });
    }

    // 2️⃣  Supabase cache
    if (supa) {
        try {
            const { data: row } = await supa
                .from('live_session_cache')
                .select('*')
                .eq('id', 1)
                .single();

            if (row?.fetched_at) {
                const dbTs = new Date(row.fetched_at).getTime();
                if (now - dbTs < CACHE_TTL_MS && row.session_data) {
                    const result = {
                        session: row.session_data,
                        drivers: row.drivers_data ?? [],
                        is_active: row.is_active ?? false,
                        fetched_at: row.fetched_at,
                        from_cache: true,
                        cache_source: 'supabase',
                        age_ms: now - dbTs,
                    };
                    memCache = { data: result, ts: dbTs };
                    return NextResponse.json(result);
                }
            }
        } catch (e) {
            console.warn('[/api/live] Supabase cache read error:', e);
        }
    }

    // 3️⃣  Fresh OpenF1 fetch
    const [sessions, positions, stints, intervals] = await Promise.all([
        openF1Get('/sessions?session_key=latest'),
        openF1Get('/position?session_key=latest'),
        openF1Get('/stints?session_key=latest'),
        openF1Get('/intervals?session_key=latest'),
    ]);

    const sessionInfo = (sessions as Array<Record<string, unknown>>)[0] ?? null;
    let isActive = false;

    if (sessionInfo) {
        try {
            const ts_start = new Date(sessionInfo.date_start as string).getTime();
            const ts_end = new Date(sessionInfo.date_end as string).getTime();
            isActive = ts_start <= now && now <= ts_end;
        } catch { /* ignore */ }
    }

    // Build merged driver map
    const driverMap = new Map<number, {
        driver_number: number; position: number;
        lap: number; gap: string; compound: string;
    }>();

    for (const p of positions as Array<Record<string, unknown>>) {
        const dn = p.driver_number as number;
        if (dn && !driverMap.has(dn)) {
            driverMap.set(dn, { driver_number: dn, position: (p.position as number) ?? 99, lap: 0, gap: '', compound: 'UNKNOWN' });
        }
    }

    for (const s of stints as Array<Record<string, unknown>>) {
        const dn = s.driver_number as number;
        const entry = driverMap.get(dn);
        if (entry) {
            entry.compound = (s.compound as string) ?? 'UNKNOWN';
            if (s.lap_end) entry.lap = s.lap_end as number;
        }
    }

    for (const iv of intervals as Array<Record<string, unknown>>) {
        const dn = iv.driver_number as number;
        const raw = (iv.gap_to_leader as number) ?? (iv.interval as number) ?? 0;
        const entry = driverMap.get(dn);
        if (entry) entry.gap = raw === 0 ? 'LEADER' : `+${raw.toFixed(3)}s`;
    }

    const driversList = Array.from(driverMap.values()).sort((a, b) => a.position - b.position);

    const result = {
        session: sessionInfo,
        drivers: driversList,
        is_active: isActive,
        fetched_at: new Date(now).toISOString(),
        from_cache: false,
        cache_source: 'live',
        age_ms: 0,
    };

    // Update caches
    memCache = { data: result, ts: now };

    if (supa) {
        supa.from('live_session_cache')
            .upsert({
                id: 1,
                session_data: sessionInfo,
                drivers_data: driversList,
                is_active: isActive,
                fetched_at: new Date(now).toISOString(),
            })
            .then(({ error }) => {
                if (error) console.warn('[Supabase] live_cache write:', error.message);
            });
    }

    return NextResponse.json(result);
}

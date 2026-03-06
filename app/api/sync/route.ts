/**
 * /api/sync
 * Syncs race results + driver consistency scores from Jolpica → Supabase.
 * Can be called manually, or scheduled via a cron service.
 * Protected by CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

const supa = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    )
    : null;

let lastSyncTime = 0;
const SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutes

async function jolpica(path: string) {
    const r = await fetch(`${JOLPICA_BASE}${path}`, { next: { revalidate: 0 } });
    if (!r.ok) throw new Error(`Jolpica ${r.status}`);
    return (await r.json()).MRData;
}

export async function GET(req: NextRequest) {
    // Optional auth guard
    const secret = req.nextUrl.searchParams.get('secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supa) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const now = Date.now();
    const force = req.nextUrl.searchParams.get('force') === 'true';
    if (!force && (now - lastSyncTime) < SYNC_COOLDOWN) {
        return NextResponse.json({
            ok: true,
            message: 'Sync recently performed. Skipping.',
            cooldown_remaining: Math.ceil((SYNC_COOLDOWN - (now - lastSyncTime)) / 1000)
        });
    }
    lastSyncTime = now;

    const yearStr = req.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear() - 1);
    const year = parseInt(yearStr);

    const log: string[] = [];

    try {
        // ── 1. Sync race results ──────────────────────────────────
        log.push(`Fetching ${year} race results...`);
        const data = await jolpica(`/${year}/results.json?limit=1000`);
        const races = (data as { RaceTable: { Races: unknown[] } }).RaceTable.Races as Array<{
            season: string; round: string; raceName: string;
            Results: Array<{
                position: string; positionText: string; points: string; status: string;
                Driver: { driverId: string; code?: string; givenName: string; familyName: string };
                Constructor: { constructorId: string; name: string };
            }>;
        }>;

        const resultRows: unknown[] = [];
        const driverMap = new Map<string, { code: string; name: string; constructorId: string; constructorName: string; positions: number[]; dnfs: number }>();

        for (const race of races) {
            const winner = race.Results?.[0];
            const p2 = race.Results?.[1];
            const p3 = race.Results?.[2];
            const rnd = parseInt(race.round);

            for (const res of race.Results ?? []) {
                const pos = parseInt(res.position);
                const isDNF = isNaN(pos) || !['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].includes(res.positionText);
                const drvId = res.Driver.driverId;
                const code = res.Driver.code ?? res.Driver.familyName.slice(0, 3).toUpperCase();
                const name = `${res.Driver.givenName} ${res.Driver.familyName}`;

                resultRows.push({
                    year,
                    round: rnd,
                    race_name: race.raceName,
                    driver_code: code,
                    driver_name: name,
                    constructor_id: res.Constructor.constructorId,
                    constructor_name: res.Constructor.name,
                    position: isDNF ? 20 : pos,
                    points: parseFloat(res.points) || 0,
                    status: res.status,
                    winner_name: winner ? `${winner.Driver.givenName} ${winner.Driver.familyName}` : '',
                    p2_name: p2 ? `${p2.Driver.givenName} ${p2.Driver.familyName}` : '',
                    p3_name: p3 ? `${p3.Driver.givenName} ${p3.Driver.familyName}` : '',
                    winner_pts: winner ? parseInt(winner.points) : null,
                    p2_pts: p2 ? parseInt(p2.points) : null,
                    p3_pts: p3 ? parseInt(p3.points) : null,
                });

                // Aggregate for consistency
                if (!driverMap.has(drvId)) {
                    driverMap.set(drvId, { code, name, constructorId: res.Constructor.constructorId, constructorName: res.Constructor.name, positions: [], dnfs: 0 });
                }
                const entry = driverMap.get(drvId)!;
                if (isDNF) { entry.dnfs++; entry.positions.push(20); }
                else entry.positions.push(pos);
                entry.constructorId = res.Constructor.constructorId;
                entry.constructorName = res.Constructor.name;
            }
        }

        // Batch upsert race results
        const chunkSize = 100;
        for (let i = 0; i < resultRows.length; i += chunkSize) {
            const chunk = resultRows.slice(i, i + chunkSize);
            const { error } = await supa.from('race_results_history')
                .upsert(chunk as Parameters<typeof supa.from>[0][], { onConflict: 'year,round,driver_code' });
            if (error) log.push(`Results upsert warning: ${error.message}`);
        }
        log.push(`✓ Synced ${resultRows.length} driver-race rows`);

        // ── 2. Compute + sync consistency scores ─────────────────
        log.push('Computing consistency scores...');
        const MAX_POS = 20;
        const consistencyRows = [];

        for (const [driverId, entry] of driverMap.entries()) {
            const last10 = entry.positions.slice(-10);
            if (!last10.length) continue;
            const avg = last10.reduce((a, b) => a + b, 0) / last10.length;
            const score = Math.max(0, Math.min(100, ((MAX_POS - avg) / (MAX_POS - 1)) * 100));

            consistencyRows.push({
                driver_id: driverId,
                driver_code: entry.code,
                driver_name: entry.name,
                constructor_id: entry.constructorId,
                constructor_name: entry.constructorName,
                season: year,
                avg_position: parseFloat(avg.toFixed(2)),
                consistency_score: parseFloat(score.toFixed(1)),
                wins: entry.positions.filter(p => p === 1).length,
                podiums: entry.positions.filter(p => p <= 3 && p >= 1).length,
                dnfs: entry.dnfs,
                races: entry.positions.length,
                recent_form: last10,
                updated_at: new Date().toISOString(),
            });
        }

        const { error: dcErr } = await supa
            .from('driver_consistency')
            .upsert(consistencyRows, { onConflict: 'driver_id' });
        if (dcErr) log.push(`Consistency upsert warning: ${dcErr.message}`);
        else log.push(`✓ Synced ${consistencyRows.length} driver consistency scores`);

        return NextResponse.json({
            ok: true,
            year,
            races: races.length,
            results: resultRows.length,
            drivers: consistencyRows.length,
            log,
        });

    } catch (e) {
        return NextResponse.json({ ok: false, error: String(e), log }, { status: 500 });
    }
}

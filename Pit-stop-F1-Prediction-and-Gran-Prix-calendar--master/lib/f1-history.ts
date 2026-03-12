// ============================================================
//  F1 History Service  —  Pit Stop App
//  Equivalent of F1DataService (Angular prompt → Next.js/TS)
//  Integrates Jolpica (Ergast successor) + OpenF1 APIs
// ============================================================

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const OPENF1_BASE = 'https://api.openf1.org/v1';

// ──────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────

export interface PodiumEntry {
    season: string;
    round: string;
    raceName: string;
    circuitName: string;
    date: string;
    position: 1 | 2 | 3;
    driverId: string;
    driverCode: string;
    driverName: string;
    constructorId: string;
    constructorName: string;
    time: string;
    points: number;
}

export interface DriverConsistency {
    driverId: string;
    driverCode: string;
    driverName: string;
    constructorName: string;
    constructorId: string;
    avgPosition: number;           // lower = better
    consistencyScore: number;        // 0-100, higher = better
    races: number;
    wins: number;
    podiums: number;
    dnfs: number;
    recentForm: number[];        // last 10 finishing positions
}

export interface LiveSessionStatus {
    isActive: boolean;
    sessionName: string;
    sessionType: string;
    location: string;
    countryName: string;
    dateStart: string;
    dateEnd: string;
}

// ──────────────────────────────────────────────
//  Internal helpers
// ──────────────────────────────────────────────

async function jolpicaFetch(endpoint: string): Promise<unknown> {
    const res = await fetch(`${JOLPICA_BASE}${endpoint}`, {
        next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Jolpica ${res.status}: ${endpoint}`);
    const json = await res.json();
    return json.MRData;
}

async function openF1Fetch(endpoint: string, params: Record<string, string | number> = {}): Promise<unknown[]> {
    const url = new URL(`${OPENF1_BASE}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
    try {
        const res = await fetch(url.toString(), { next: { revalidate: 10 } });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

// ──────────────────────────────────────────────
//  1.  getHistoricalPodiums
//      Fetches race results for the last N years
//      and returns only Top-3 finishers per race.
// ──────────────────────────────────────────────

export async function getHistoricalPodiums(years: number = 5): Promise<PodiumEntry[]> {
    const currentYear = new Date().getFullYear();
    // Include back N years starting from the last completed season
    const seasonRange = Array.from({ length: years }, (_, i) => currentYear - 1 - i);

    const seasonFetches = seasonRange.map(async (year): Promise<PodiumEntry[]> => {
        try {
            const data = await jolpicaFetch(`/${year}/results.json?limit=1000`) as {
                RaceTable: {
                    Races: Array<{
                        season: string;
                        round: string;
                        raceName: string;
                        Circuit: { circuitName: string };
                        date: string;
                        Results: Array<{
                            position: string;
                            points: string;
                            status: string;
                            Driver: {
                                driverId: string;
                                code?: string;
                                givenName: string;
                                familyName: string;
                            };
                            Constructor: {
                                constructorId: string;
                                name: string;
                            };
                            Time?: { time: string };
                        }>;
                    }>;
                };
            };

            const races = data.RaceTable.Races;
            const podiums: PodiumEntry[] = [];

            for (const race of races) {
                if (!race.Results) continue;

                for (const result of race.Results) {
                    const pos = parseInt(result.position, 10);
                    if (pos < 1 || pos > 3) continue;

                    podiums.push({
                        season: race.season,
                        round: race.round,
                        raceName: race.raceName,
                        circuitName: race.Circuit.circuitName,
                        date: race.date,
                        position: pos as 1 | 2 | 3,
                        driverId: result.Driver.driverId,
                        driverCode: result.Driver.code ?? result.Driver.familyName.slice(0, 3).toUpperCase(),
                        driverName: `${result.Driver.givenName} ${result.Driver.familyName}`,
                        constructorId: result.Constructor.constructorId,
                        constructorName: result.Constructor.name,
                        time: result.Time?.time ?? result.status,
                        points: parseFloat(result.points) || 0,
                    });
                }
            }

            return podiums;
        } catch (err) {
            console.error(`[f1-history] Failed to fetch ${year} results:`, err);
            return [];
        }
    });

    const nested = await Promise.all(seasonFetches);
    // Flatten and sort by date descending (newest first)
    return nested.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ──────────────────────────────────────────────
//  2.  calculateDriverConsistencyScore
//      Based on average finishing position over
//      the last 10 races.  Score 0-100 (100 = perfect).
// ──────────────────────────────────────────────

export async function calculateDriverConsistencyScores(
    season: string = String(new Date().getFullYear() - 1)
): Promise<DriverConsistency[]> {
    try {
        const data = await jolpicaFetch(`/${season}/results.json?limit=1000`) as {
            RaceTable: {
                Races: Array<{
                    Results: Array<{
                        position: string;
                        positionText: string;
                        points: string;
                        status: string;
                        Driver: {
                            driverId: string;
                            code?: string;
                            givenName: string;
                            familyName: string;
                        };
                        Constructor: {
                            constructorId: string;
                            name: string;
                        };
                    }>;
                }>;
            };
        };

        // Build per-driver race result history
        const driverMap = new Map<string, {
            driverCode: string;
            driverName: string;
            constructorId: string;
            constructorName: string;
            positions: number[];
            dnfs: number;
        }>();

        for (const race of data.RaceTable.Races) {
            for (const result of race.Results ?? []) {
                const id = result.Driver.driverId;
                const pos = parseInt(result.position, 10);
                const isDNF = isNaN(pos) || result.positionText === 'R' || result.positionText === 'D' || result.positionText === 'E' || result.positionText === 'W' || result.positionText === 'F' || result.positionText === 'N';

                if (!driverMap.has(id)) {
                    driverMap.set(id, {
                        driverCode: result.Driver.code ?? result.Driver.familyName.slice(0, 3).toUpperCase(),
                        driverName: `${result.Driver.givenName} ${result.Driver.familyName}`,
                        constructorId: result.Constructor.constructorId,
                        constructorName: result.Constructor.name,
                        positions: [],
                        dnfs: 0,
                    });
                }

                const entry = driverMap.get(id)!;
                if (isDNF) {
                    entry.dnfs++;
                    entry.positions.push(20); // penalty position for DNF
                } else {
                    entry.positions.push(pos);
                }
                // Keep latest constructor (teams change mid-season less often than we update)
                entry.constructorId = result.Constructor.constructorId;
                entry.constructorName = result.Constructor.name;
            }
        }

        // Compute scores
        const scores: DriverConsistency[] = [];
        const MAX_POSITION = 20;

        for (const [id, entry] of driverMap.entries()) {
            const last10 = entry.positions.slice(-10);
            if (last10.length === 0) continue;

            const avgPos = last10.reduce((a, b) => a + b, 0) / last10.length;
            // Consistency score: 100 if always P1, drops linearly toward 0 at P20
            const rawScore = ((MAX_POSITION - avgPos) / (MAX_POSITION - 1)) * 100;
            const score = Math.max(0, Math.min(100, rawScore));

            scores.push({
                driverId: id,
                driverCode: entry.driverCode,
                driverName: entry.driverName,
                constructorId: entry.constructorId,
                constructorName: entry.constructorName,
                avgPosition: parseFloat(avgPos.toFixed(2)),
                consistencyScore: parseFloat(score.toFixed(1)),
                races: entry.positions.length,
                wins: entry.positions.filter(p => p === 1).length,
                podiums: entry.positions.filter(p => p >= 1 && p <= 3).length,
                dnfs: entry.dnfs,
                recentForm: last10,
            });
        }

        // Sort by consistency score descending
        return scores.sort((a, b) => b.consistencyScore - a.consistencyScore);
    } catch (err) {
        console.error('[f1-history] calculateDriverConsistencyScores error:', err);
        return [];
    }
}

// ──────────────────────────────────────────────
//  3.  getLiveSessionStatus
//      Checks OpenF1 to see if a race session is
//      currently active (for the polling mechanism).
// ──────────────────────────────────────────────

export async function getLiveSessionStatus(): Promise<LiveSessionStatus> {
    try {
        const sessions = await openF1Fetch('/sessions', { session_key: 'latest' }) as Array<{
            session_name: string;
            session_type: string;
            location: string;
            country_name: string;
            date_start: string;
            date_end: string;
        }>;

        if (!sessions || sessions.length === 0) {
            return { isActive: false, sessionName: '', sessionType: '', location: '', countryName: '', dateStart: '', dateEnd: '' };
        }

        const s = sessions[0];
        const now = Date.now();
        const start = new Date(s.date_start).getTime();
        const end = new Date(s.date_end).getTime();
        const isActive = now >= start && now <= end;

        return {
            isActive,
            sessionName: s.session_name,
            sessionType: s.session_type,
            location: s.location,
            countryName: s.country_name,
            dateStart: s.date_start,
            dateEnd: s.date_end,
        };
    } catch {
        return { isActive: false, sessionName: '', sessionType: '', location: '', countryName: '', dateStart: '', dateEnd: '' };
    }
}

// ──────────────────────────────────────────────
//  4.  getLiveRaceUpdates
//      Fetches live position data from OpenF1.
//      Intended to be called every 30 s via the
//      React hook below when a session is active.
// ──────────────────────────────────────────────

export interface LiveDriver {
    driverNumber: number;
    position: number;
    lap: number;
    gap: string;
    compound: string;
}

export async function getLiveRaceUpdates(): Promise<LiveDriver[]> {
    try {
        const [positions, stints, intervals] = await Promise.all([
            openF1Fetch('/position', { session_key: 'latest' }),
            openF1Fetch('/stints', { session_key: 'latest' }),
            openF1Fetch('/intervals', { session_key: 'latest' }),
        ]);

        // Build a merged map of driver_number → latest data
        const map = new Map<number, LiveDriver>();

        for (const p of positions as Array<{ driver_number: number; position: number; session_key: number }>) {
            const existing = map.get(p.driver_number);
            if (!existing) {
                map.set(p.driver_number, {
                    driverNumber: p.driver_number,
                    position: p.position,
                    lap: 0,
                    gap: '',
                    compound: 'UNKNOWN',
                });
            }
        }

        for (const s of stints as Array<{ driver_number: number; compound: string; lap_end?: number }>) {
            const entry = map.get(s.driver_number);
            if (entry) {
                entry.compound = s.compound ?? 'UNKNOWN';
                if (s.lap_end) entry.lap = s.lap_end;
            }
        }

        for (const i of intervals as Array<{ driver_number: number; gap_to_leader?: number; interval?: number }>) {
            const entry = map.get(i.driver_number);
            if (entry) {
                const raw = i.gap_to_leader ?? i.interval ?? 0;
                entry.gap = raw === 0 ? 'LEADER' : `+${raw.toFixed(3)}s`;
            }
        }

        return Array.from(map.values()).sort((a, b) => a.position - b.position);
    } catch {
        return [];
    }
}

// ──────────────────────────────────────────────
//  5.  React hook — useLivePolling
//      Polls for live updates every 30 s
//      only when a race session is active.
//      Import in a 'use client' component.
// ──────────────────────────────────────────────

// NOTE: This is defined here as an exportable helper so the page component
//       can use it. The actual useState/useEffect is in the component.
export const LIVE_POLL_INTERVAL_MS = 30_000;

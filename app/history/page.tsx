'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './history.module.css';
import {
    getHistoricalPodiums,
    calculateDriverConsistencyScores,
    LIVE_POLL_INTERVAL_MS,
    type PodiumEntry,
    type DriverConsistency,
} from '@/lib/f1-history';
import { getLiveData, type LiveData } from '@/lib/ml-engine';
import { getTeamColor } from '@/lib/team-colors';

// ─── Icons (inline SVG to avoid extra deps) ───────────────────────────────

const IconTrophy = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))' }}>
        <path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
        <path d="M12 17c-2.8 0-5-2.2-5-5V4h10v8c0 2.8-2.2 5-5 5z" />
        <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

const IconPodium = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 20H2" /><path d="M7 20V10" /><path d="M11 20V6" /><path d="M15 20V14" />
        <rect x="7" y="10" width="4" height="10" /><rect x="11" y="6" width="4" height="14" /><rect x="15" y="14" width="4" height="6" />
    </svg>
);

const IconChart = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M18 17l-6-6-4 4-5-5" />
    </svg>
);

const IconRadio = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.48" /><path d="M17.66 6.34a8 8 0 0 1 0 11.32" /><path d="M7.76 16.24a6 6 0 0 1 0-8.48" /><path d="M6.34 17.66a8 8 0 0 1 0-11.32" />
    </svg>
);

const IconLive = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="12" opacity="0.2" />
        <circle cx="12" cy="12" r="6" />
    </svg>
);

const IconRefresh = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const IconFilter = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

// ─── Medal colours ─────────────────────────────────────────────────────────

const MEDAL: Record<number, string> = {
    1: '#FFD700',   // Gold
    2: '#C0C0C0',   // Silver
    3: '#CD7F32',   // Bronze
};

const MEDAL_LABEL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// ─── Helper ────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
    if (score >= 80) return '#00e676';
    if (score >= 60) return '#FFD700';
    if (score >= 40) return '#ff9800';
    return '#ef5350';
}

function formDot(pos: number): string {
    if (pos === 1) return '#FFD700';
    if (pos <= 3) return '#4CAF50';
    if (pos <= 10) return '#2196F3';
    if (pos <= 15) return '#9C27B0';
    return '#ef5350';
}

// ─── Component ─────────────────────────────────────────────────────────────

type TabId = 'podiums' | 'consistency' | 'live';
const YEAR_NOW = new Date().getFullYear();
const YEARS_OPT = [3, 5, 7, 10];

export default function HistoryPage() {
    const [tab, setTab] = useState<TabId>('podiums');
    const [yearsBack, setYears] = useState(5);
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterPos, setFilterPos] = useState<string>('all');

    const [podiums, setPodiums] = useState<PodiumEntry[]>([]);
    const [consistency, setConsistency] = useState<DriverConsistency[]>([]);
    const [liveData, setLiveData] = useState<LiveData | null>(null);
    const [loading, setLoading] = useState(false);
    const [liveLoading, setLiveLoading] = useState(false);
    const [lastPoll, setLastPoll] = useState<Date | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch historical podiums ────────────────────────────────────────────
    const fetchPodiums = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getHistoricalPodiums(yearsBack);
            setPodiums(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [yearsBack]);

    // ── Fetch consistency scores ────────────────────────────────────────────
    const fetchConsistency = useCallback(async () => {
        setLoading(true);
        try {
            const prevYear = String(YEAR_NOW - 1);
            const data = await calculateDriverConsistencyScores(prevYear);
            setConsistency(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, []);

    // ── Live polling (via /api/live — server-cached 30s, no CORS) ───────────
    const pollLive = useCallback(async () => {
        setLiveLoading(true);
        try {
            const data = await getLiveData();
            if (data) setLiveData(data);
            setLastPoll(new Date());
        } catch (e) {
            console.error(e);
        }
        setLiveLoading(false);
    }, []);

    useEffect(() => {
        if (tab === 'podiums') fetchPodiums();
        if (tab === 'consistency') fetchConsistency();
        if (tab === 'live') {
            pollLive();
            pollRef.current = setInterval(pollLive, LIVE_POLL_INTERVAL_MS);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [tab, fetchPodiums, fetchConsistency, pollLive]);

    // ── Derived filter for podiums ──────────────────────────────────────────
    const filteredPodiums = podiums.filter(p => {
        const yearOk = filterYear === 'all' || p.season === filterYear;
        const posOk = filterPos === 'all' || String(p.position) === filterPos;
        return yearOk && posOk;
    });

    // Available seasons from loaded data
    const availableSeasons = [...new Set(podiums.map(p => p.season))].sort((a, b) => +b - +a);

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className={styles.page}>
            <div className={styles.container}>

                {/* ─── Header ─────────────────────────────────────────────── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}><IconTrophy size={30} /></div>
                        <div>
                            <h1 className={styles.title}>Historical Podiums</h1>
                            <p className={styles.subtitle}>
                                Top-3 finishers · Driver Consistency Scores · Live Race Updates
                            </p>
                        </div>
                    </div>

                    {/* Live badge */}
                    {liveData?.is_active && (
                        <div className={styles.liveBadge}>
                            <span className={styles.liveDot}><IconLive size={12} /></span>
                            LIVE — {liveData.session?.session_name}
                        </div>
                    )}
                </div>

                {/* ─── Tabs ───────────────────────────────────────────────── */}
                <div className={styles.tabs}>
                    {(['podiums', 'consistency', 'live'] as TabId[]).map(t => (
                        <button
                            key={t}
                            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                            onClick={() => setTab(t)}
                        >
                            {t === 'podiums' && <><IconPodium size={18} /> Podiums</>}
                            {t === 'consistency' && <><IconChart size={18} /> Consistency</>}
                            {t === 'live' && <><IconRadio size={18} /> Live Race</>}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════════════
            TAB: PODIUMS
        ══════════════════════════════════════════════════════════ */}
                {tab === 'podiums' && (
                    <>
                        {/* Controls */}
                        <div className={styles.controls}>
                            <div className={styles.controlGroup}>
                                <IconFilter size={14} />
                                <label className={styles.controlLabel}>Years back</label>
                                <div className={styles.pillGroup}>
                                    {YEARS_OPT.map(y => (
                                        <button
                                            key={y}
                                            className={`${styles.pill} ${yearsBack === y ? styles.pillActive : ''}`}
                                            onClick={() => setYears(y)}
                                        >
                                            {y}Y
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Season</label>
                                <select
                                    className={styles.select}
                                    value={filterYear}
                                    onChange={e => setFilterYear(e.target.value)}
                                >
                                    <option value="all">All seasons</option>
                                    {availableSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Position</label>
                                <select
                                    className={styles.select}
                                    value={filterPos}
                                    onChange={e => setFilterPos(e.target.value)}
                                >
                                    <option value="all">All podium</option>
                                    <option value="1">🥇 Winner</option>
                                    <option value="2">🥈 2nd</option>
                                    <option value="3">🥉 3rd</option>
                                </select>
                            </div>

                            <button className={styles.refreshBtn} onClick={fetchPodiums}>
                                <IconRefresh size={14} /> Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className={styles.loadingState}>
                                <div className={styles.spinner} />
                                <p>Loading {yearsBack} years of podiums…</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table} id="podiums-table">
                                    <thead>
                                        <tr>
                                            <th className={styles.th}>Pos</th>
                                            <th className={styles.th}>Race</th>
                                            <th className={styles.th}>Season</th>
                                            <th className={styles.th}>Date</th>
                                            <th className={styles.th}>Driver</th>
                                            <th className={styles.th}>Constructor</th>
                                            <th className={styles.th}>Time / Gap</th>
                                            <th className={styles.th}>Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPodiums.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className={styles.emptyRow}>
                                                    No results match the current filter.
                                                </td>
                                            </tr>
                                        ) : filteredPodiums.map((p, i) => {
                                            const isWinner = p.position === 1;
                                            const teamColor = getTeamColor(p.constructorId);
                                            return (
                                                <tr
                                                    key={`${p.season}-${p.round}-${p.position}`}
                                                    className={`${styles.tr} ${isWinner ? styles.trWinner : ''}`}
                                                    style={{ animationDelay: `${(i % 30) * 20}ms` }}
                                                >
                                                    <td className={styles.td}>
                                                        <span
                                                            className={styles.medalBadge}
                                                            style={{ color: MEDAL[p.position] }}
                                                        >
                                                            {MEDAL_LABEL[p.position]}
                                                        </span>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <span className={styles.raceName}>{p.raceName}</span>
                                                        <span className={styles.circuitName}>{p.circuitName}</span>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <span className={styles.seasonBadge}>{p.season}</span>
                                                    </td>
                                                    <td className={styles.td}>
                                                        {new Date(p.date).toLocaleDateString('en-GB', {
                                                            day: '2-digit', month: 'short', year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className={styles.td}>
                                                        <div className={styles.driverCell}>
                                                            <span
                                                                className={styles.driverCode}
                                                                style={{ color: isWinner ? '#FFD700' : 'inherit' }}
                                                            >
                                                                {p.driverCode}
                                                            </span>
                                                            <span className={styles.driverName}>{p.driverName}</span>
                                                        </div>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <div className={styles.constructorCell}>
                                                            <span
                                                                className={styles.constructorBar}
                                                                style={{ background: teamColor }}
                                                            />
                                                            {p.constructorName}
                                                        </div>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <span className={styles.raceTime}>{p.time}</span>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <span className={styles.pointsBadge}>{p.points}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                <p className={styles.tableFooter}>
                                    Showing {filteredPodiums.length} podium entries
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
            TAB: CONSISTENCY SCORES
        ══════════════════════════════════════════════════════════ */}
                {tab === 'consistency' && (
                    <>
                        <div className={styles.consistencyIntro}>
                            <p>
                                Driver Consistency Score is calculated from the average finishing position
                                across the last 10 races of the previous season.
                                Score range: <strong>0 – 100</strong> (higher = more consistent / better finishes).
                                DNFs count as P20.
                            </p>
                        </div>

                        {loading ? (
                            <div className={styles.loadingState}>
                                <div className={styles.spinner} />
                                <p>Crunching {YEAR_NOW - 1} season data…</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table} id="consistency-table">
                                    <thead>
                                        <tr>
                                            <th className={styles.th}>Rank</th>
                                            <th className={styles.th}>Driver</th>
                                            <th className={styles.th}>Constructor</th>
                                            <th className={styles.th}>Score</th>
                                            <th className={styles.th}>Avg Pos</th>
                                            <th className={styles.th}>Races</th>
                                            <th className={styles.th}>Wins</th>
                                            <th className={styles.th}>Podiums</th>
                                            <th className={styles.th}>DNFs</th>
                                            <th className={styles.th}>Recent Form (last 10)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consistency.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className={styles.emptyRow}>
                                                    No data available.
                                                </td>
                                            </tr>
                                        ) : consistency.map((d, i) => {
                                            const teamColor = getTeamColor(d.constructorId);
                                            const sc = d.consistencyScore;
                                            return (
                                                <tr
                                                    key={d.driverId}
                                                    className={`${styles.tr} ${i === 0 ? styles.trWinner : ''}`}
                                                    style={{ animationDelay: `${i * 25}ms` }}
                                                >
                                                    <td className={styles.td}>
                                                        <span className={styles.rankBadge}>
                                                            {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                                                        </span>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <div className={styles.driverCell}>
                                                            <span className={styles.driverCode}>{d.driverCode}</span>
                                                            <span className={styles.driverName}>{d.driverName}</span>
                                                        </div>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <div className={styles.constructorCell}>
                                                            <span className={styles.constructorBar} style={{ background: teamColor }} />
                                                            {d.constructorName}
                                                        </div>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <div className={styles.scoreCell}>
                                                            <div className={styles.scoreBar}>
                                                                <div
                                                                    className={styles.scoreFill}
                                                                    style={{ width: `${sc}%`, background: scoreColor(sc) }}
                                                                />
                                                            </div>
                                                            <span className={styles.scoreNum} style={{ color: scoreColor(sc) }}>
                                                                {sc}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <span className={styles.avgPos}>P{d.avgPosition}</span>
                                                    </td>
                                                    <td className={styles.td}>{d.races}</td>
                                                    <td className={styles.td}>
                                                        <span style={{ color: '#FFD700', fontWeight: 700 }}>{d.wins}</span>
                                                    </td>
                                                    <td className={styles.td}>{d.podiums}</td>
                                                    <td className={styles.td}>
                                                        <span style={{ color: d.dnfs > 2 ? '#ef5350' : 'inherit' }}>{d.dnfs}</span>
                                                    </td>
                                                    <td className={styles.td}>
                                                        <div className={styles.formDots}>
                                                            {d.recentForm.map((pos, j) => (
                                                                <span
                                                                    key={j}
                                                                    className={styles.formDot}
                                                                    style={{ background: formDot(pos) }}
                                                                    title={`P${pos}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <p className={styles.tableFooter}>
                                    Based on {YEAR_NOW - 1} season · {consistency.length} drivers ranked
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
            TAB: LIVE RACE
        ══════════════════════════════════════════════════════════ */}
                {tab === 'live' && (
                    <div className={styles.liveSection}>
                        {/* Session pill */}
                        <div className={styles.liveHeader}>
                            <div
                                className={`${styles.sessionPill} ${liveData?.is_active ? styles.sessionActive : styles.sessionInactive}`}
                            >
                                <IconLive size={12} />
                                {liveData?.is_active
                                    ? `🔴 LIVE — ${liveData.session?.session_name ?? 'Race'} · ${liveData.session?.location ?? ''}, ${liveData.session?.country_name ?? ''}`
                                    : liveData?.session
                                        ? `⏸ Offline — Last: ${liveData.session.session_name} · ${liveData.session.location}`
                                        : '⏳ Checking session via /api/live…'
                                }
                            </div>

                            <div className={styles.pollInfo}>
                                {lastPoll && <span>Updated {lastPoll.toLocaleTimeString()}</span>}
                                {liveData?.cache_source && (
                                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>src: {liveData.cache_source}</span>
                                )}
                                <button className={styles.refreshBtn} onClick={pollLive} disabled={liveLoading}>
                                    <IconRefresh size={13} /> {liveLoading ? 'Polling…' : 'Poll now'}
                                </button>
                                <span className={styles.autoHint}>Auto-polls every 30 s</span>
                            </div>
                        </div>

                        {!liveData?.is_active && (
                            <div className={styles.offlineBanner}>
                                <p>
                                    <strong>No active race session detected.</strong> Live data will appear here
                                    automatically during a race weekend. Data is served from
                                    <strong> Supabase cache → OpenF1</strong> — no CORS issues, no rate limits.
                                </p>
                            </div>
                        )}

                        {(liveData?.drivers?.length ?? 0) > 0 ? (
                            <div className={styles.tableWrap}>
                                <table className={styles.table} id="live-table">
                                    <thead>
                                        <tr>
                                            <th className={styles.th}>Pos</th>
                                            <th className={styles.th}>Driver #</th>
                                            <th className={styles.th}>Gap to Leader</th>
                                            <th className={styles.th}>Lap</th>
                                            <th className={styles.th}>Tyre</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {liveData!.drivers.map((d, i) => {
                                            const isLeader = d.gap === 'LEADER';
                                            const compound = d.compound ?? 'UNKNOWN';
                                            const tyreColor =
                                                compound === 'SOFT' ? '#ff3333' :
                                                    compound === 'MEDIUM' ? '#ffdd00' :
                                                        compound === 'HARD' ? '#ffffff' :
                                                            compound === 'INTER' ? '#33cc33' :
                                                                compound === 'WET' ? '#1177ff' : '#888';

                                            return (
                                                <tr
                                                    key={d.driver_number}
                                                    className={`${styles.tr} ${isLeader ? styles.trWinner : ''}`}
                                                    style={{ animationDelay: `${i * 20}ms` }}
                                                >
                                                    <td className={styles.td}>
                                                        <span className={styles.medalBadge} style={{ color: MEDAL[d.position] ?? 'inherit' }}>
                                                            {d.position <= 3 ? MEDAL_LABEL[d.position] : `P${d.position}`}
                                                        </span>
                                                    </td>
                                                    <td className={styles.td}><span className={styles.driverCode}>#{d.driver_number}</span></td>
                                                    <td className={styles.td}>
                                                        <span className={isLeader ? styles.leaderGap : styles.raceTime}>
                                                            {isLeader ? '— LEADER —' : d.gap}
                                                        </span>
                                                    </td>
                                                    <td className={styles.td}>{d.lap || '—'}</td>
                                                    <td className={styles.td}>
                                                        <span className={styles.tyreBadge} style={{ color: tyreColor, borderColor: tyreColor }}>
                                                            {compound[0]}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.loadingState}>
                                {liveLoading
                                    ? <><div className={styles.spinner} /><p>Fetching live data via server cache…</p></>
                                    : <p className={styles.noLive}>No live driver data yet<br /><span>Check back during a race weekend</span></p>
                                }
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, BarChart3, Radio, RefreshCw, Filter, Calendar, Users, Briefcase, Activity, Clock, Medal } from 'lucide-react';
import styles from './history.module.css';
import { getHistoricalPodiums, calculateDriverConsistencyScores, LIVE_POLL_INTERVAL_MS, type PodiumEntry, type DriverConsistency } from '@/lib/f1-history';
import { getLiveData, type LiveData } from '@/lib/ml-engine';
import { getTeamColor } from '@/lib/team-colors';
import { getTeamLogo } from '@/lib/team-logos';

// ... (skipping icons and helper functions)


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

const MEDAL_LABEL: Record<number, string> = { 1: 'P1', 2: 'P2', 3: 'P3' };

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
                    {(['podiums', 'consistency', 'live'] as TabId[]).map(t => {
                        const Icon = t === 'podiums' ? Trophy : t === 'consistency' ? BarChart3 : Radio;
                        return (
                            <button
                                key={t}
                                className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                                onClick={() => setTab(t)}
                            >
                                <Icon size={18} />
                                <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                {tab === t && <motion.div layoutId="tab-line" className={styles.tabLine} />}
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {tab === 'podiums' && (
                        <motion.div
                            key="podiums"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className={styles.controls}>
                                <div className={styles.controlGroup}>
                                    <Filter size={14} />
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
                                <button className={styles.refreshBtn} onClick={fetchPodiums}>
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className={styles.loadingState}>
                                    <div className={styles.spinner} />
                                    <p className="text-mono">SYNCING ARCHIVES…</p>
                                </div>
                            ) : (
                                <motion.div
                                    className={styles.podiumGrid}
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                                    }}
                                >
                                    {filteredPodiums.map((p, i) => {
                                        const medalColor = MEDAL[p.position];
                                        return (
                                            <motion.div
                                                key={`${p.season}-${p.round}-${p.position}`}
                                                variants={{
                                                    hidden: { opacity: 0, scale: 0.95 },
                                                    visible: { opacity: 1, scale: 1 }
                                                }}
                                                className={`${styles.podiumCard} glass-card`}
                                            >
                                                <div className={styles.cardHeader}>
                                                    <div className={styles.rankBadge} style={{ color: medalColor }}>
                                                        {MEDAL_LABEL[p.position]}
                                                    </div>
                                                    <div className={styles.raceMeta}>
                                                        <span className={styles.seasonBadge}>{p.season}</span>
                                                        <span className={`${styles.raceDate} text-mono`}>{new Date(p.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <h3 className={styles.raceTitle}>{p.raceName}</h3>
                                                <div className={styles.driverInfo}>
                                                    <span className={`${styles.driverCode} text-mono`}>{p.driverCode}</span>
                                                    <span className={styles.driverName}>{p.driverName}</span>
                                                </div>
                                                <div className={styles.teamMeta}>
                                                    <span className={styles.teamBar} style={{ background: getTeamColor(p.constructorId) }} />
                                                    <span className={styles.teamName}>{p.constructorName}</span>
                                                </div>
                                                <div className={styles.cardFooter}>
                                                    <span className={`${styles.raceTime} text-mono`}>{p.time}</span>
                                                    <span className={styles.pointsBadge}>{p.points} PTS</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {tab === 'consistency' && (
                        <motion.div
                            key="consistency"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={styles.consistencyContent}
                        >
                            <motion.div
                                className={styles.consistencyGrid}
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                                }}
                            >
                                {consistency.map((d, i) => (
                                    <motion.div
                                        key={d.driverId}
                                        variants={{
                                            hidden: { opacity: 0, x: -20 },
                                            visible: { opacity: 1, x: 0 }
                                        }}
                                        className={`${styles.consistencyCard} glass-card`}
                                    >
                                        <div className={styles.driverRank}>
                                            <span className={styles.rankNum}>#{i + 1}</span>
                                            <div className={styles.teamLogoWrapMini}>
                                                <img src={getTeamLogo(d.constructorId)} alt={d.constructorName} className={styles.teamLogo} />
                                            </div>
                                            <div className={styles.driverCore}>
                                                <span className={`${styles.driverCode} text-mono`}>{d.driverCode}</span>
                                                <span className={styles.driverName}>{d.driverName}</span>
                                            </div>
                                        </div>
                                        <div className={styles.scoreSection}>
                                            <div className={styles.scoreHeader}>
                                                <span className={styles.scoreLabel}>Consistency Index</span>
                                                <span className={`${styles.scoreValue} text-mono`} style={{ color: scoreColor(d.consistencyScore) }}>{d.consistencyScore}%</span>
                                            </div>
                                            <div className={styles.scoreBar}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${d.consistencyScore}%` }}
                                                    className={styles.scoreFill}
                                                    style={{ backgroundColor: scoreColor(d.consistencyScore) }}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.consistencyStats}>
                                            <div className={styles.miniStat}>
                                                <span>AVG</span>
                                                <span className="text-mono">P{d.avgPosition}</span>
                                            </div>
                                            <div className={styles.miniStat}>
                                                <span>POD</span>
                                                <span className="text-mono">{d.podiums}</span>
                                            </div>
                                            <div className={styles.miniStat}>
                                                <span>DNF</span>
                                                <span className="text-mono">{d.dnfs}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}

                    {tab === 'live' && (
                        <motion.div
                            key="live"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={styles.liveSection}
                        >
                            <div className={styles.liveHeader}>
                                <div className={`${styles.sessionPill} ${liveData?.is_active ? styles.sessionActive : styles.sessionInactive}`}>
                                    <IconRadio size={16} />
                                    <span>{liveData?.is_active ? 'LIVE SESSION ACTIVE' : 'NO LIVE SESSION'}</span>
                                </div>
                                {lastPoll && (
                                    <div className={styles.pollInfo}>
                                        <Clock size={12} />
                                        <span>Last update: {lastPoll.toLocaleTimeString()}</span>
                                        <span className={styles.autoHint}>(Auto-polling every 30s)</span>
                                    </div>
                                )}
                            </div>

                            {!liveData?.is_active ? (
                                <div className={styles.noLive}>
                                    <div className={styles.offlineBanner}>
                                        <div style={{ opacity: 0.2, marginBottom: 12 }}>
                                            <IconRefresh size={24} />
                                        </div>
                                        <p>No live Formula 1 session is currently being broadcast.</p>
                                        <span>Historical data and consistency scores remain available.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.podiumGrid}>
                                    {(liveData.drivers || []).map((driver: any) => (
                                        <motion.div
                                            key={driver.driver_number}
                                            className={`${styles.podiumCard} glass-card`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            <div className={styles.cardHeader}>
                                                <div className={styles.rankBadge} style={{ color: driver.position <= 3 ? MEDAL[driver.position] : '#fff' }}>
                                                    P{driver.position}
                                                </div>
                                                <div className={styles.raceMeta}>
                                                    <span className={styles.tyreBadge} style={{
                                                        borderColor: driver.compound === 'SOFT' ? '#f44336' : driver.compound === 'MEDIUM' ? '#ffeb3b' : '#fff',
                                                        color: driver.compound === 'SOFT' ? '#f44336' : driver.compound === 'MEDIUM' ? '#ffeb3b' : '#fff'
                                                    }}>
                                                        {driver.compound?.[0] || '?'}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className={styles.raceTitle}>{driver.driver_name || `Driver #${driver.driver_number}`}</h3>

                                            <div className={styles.driverInfo}>
                                                <span className={`${styles.driverCode} text-mono`}>LAP {driver.lap}</span>
                                                <span className={styles.leaderGap}>{driver.gap}</span>
                                            </div>

                                            <div className={styles.teamMeta}>
                                                <span className={styles.teamBar} style={{ background: getTeamColor(getTeamNameForDriver(driver.driver_number)) }} />
                                                <span className={styles.teamName}>F1 Competitor</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Helper to estimate team since OpenF1 driver data is sometimes barebones
function getTeamNameForDriver(num: number): string {
    const mapping: Record<number, string> = {
        1: 'red_bull', 11: 'red_bull',
        44: 'mercedes', 63: 'mercedes',
        16: 'ferrari', 55: 'ferrari',
        4: 'mclaren', 81: 'mclaren',
        14: 'aston_martin', 18: 'aston_martin',
        10: 'alpine', 31: 'alpine',
        23: 'williams', 2: 'williams',
        27: 'haas', 20: 'haas',
        24: 'kick_sauber', 77: 'kick_sauber',
        3: 'rb', 22: 'rb'
    };
    return mapping[num] || 'f1';
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './records.module.css';
import {
    getFastestLaps,
    Race
} from '@/lib/f1-api';
import { getTeamColor } from '@/lib/team-colors';
import {
    TrophyIcon, FlagIcon, BoltIcon, MedalIcon, ClockIcon,
    StatsIcon, RacingCarIcon, SpeedometerIcon, HelmetIcon,
    ConstructorIcon, PitStopIcon, CircuitIcon
} from '@/components/Icons';

interface FastestLapInfo {
    raceName: string;
    driver: string;
    constructor: string;
    constructorId: string;
    time: string;
    speed: string;
}

const recordIcons: { [key: string]: React.ReactNode } = {
    'trophy': <TrophyIcon size={20} color="#FFD700" />,
    'flag': <FlagIcon size={20} color="#E10600" />,
    'bolt': <BoltIcon size={20} color="#FFC906" />,
    'medal': <MedalIcon size={20} color="#FFD700" />,
    'clock': <ClockIcon size={20} color="#2293D1" />,
    'stats': <StatsIcon size={20} color="#39B54A" />,
    'car': <RacingCarIcon size={20} color="#E10600" />,
    'speed': <SpeedometerIcon size={20} color="#F58020" />,
    'helmet': <HelmetIcon size={20} color="#E10600" />,
    'constructor': <ConstructorIcon size={20} color="#E10600" />,
    'pitstop': <PitStopIcon size={20} color="#39B54A" />,
    'circuit': <CircuitIcon size={20} color="#2293D1" />,
};

export default function RecordsPage() {
    const [fastestLaps, setFastestLaps] = useState<FastestLapInfo[]>([]);
    const [activeTab, setActiveTab] = useState<'fastest' | 'history'>('fastest');
    const [loading, setLoading] = useState(true);
    const [selectedSeason, setSelectedSeason] = useState('current');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const fastData = await getFastestLaps(selectedSeason);

            const lapData: FastestLapInfo[] = fastData.map((race: Race) => {
                const res = race.Results?.[0];
                return {
                    raceName: race.raceName,
                    driver: res ? `${res.Driver.givenName} ${res.Driver.familyName}` : 'N/A',
                    constructor: res?.Constructor.name || 'N/A',
                    constructorId: res?.Constructor.constructorId || '',
                    time: res?.FastestLap?.Time?.time || 'N/A',
                    speed: res?.FastestLap?.AverageSpeed?.speed || 'N/A',
                };
            });
            setFastestLaps(lapData);
        } catch (error) {
            console.error('Error fetching records:', error);
        }
        setLoading(false);
    }, [selectedSeason]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const historicalRecords = [
        { record: 'Most World Championships', holder: 'Lewis Hamilton / Michael Schumacher', value: '7', iconKey: 'trophy' },
        { record: 'Most Race Wins', holder: 'Lewis Hamilton', value: '105', iconKey: 'flag' },
        { record: 'Most Pole Positions', holder: 'Lewis Hamilton', value: '104', iconKey: 'bolt' },
        { record: 'Most Podiums', holder: 'Lewis Hamilton', value: '201', iconKey: 'medal' },
        { record: 'Most Fastest Laps', holder: 'Michael Schumacher', value: '77', iconKey: 'clock' },
        { record: 'Most Points in a Season', holder: 'Max Verstappen (2023)', value: '575', iconKey: 'stats' },
        { record: 'Most Wins in a Season', holder: 'Max Verstappen (2023)', value: '19', iconKey: 'bolt' },
        { record: 'Most Consecutive Wins', holder: 'Max Verstappen (2023)', value: '10', iconKey: 'stats' },
        { record: 'Most Grand Prix Entries', holder: 'Fernando Alonso', value: '401+', iconKey: 'car' },
        { record: 'Youngest World Champion', holder: 'Sebastian Vettel (2010)', value: '23y 134d', iconKey: 'helmet' },
        { record: 'Most Constructor Titles', holder: 'Ferrari', value: '16', iconKey: 'constructor' },
        { record: 'Most Constructor Wins', holder: 'Ferrari', value: '243', iconKey: 'constructor' },
        { record: 'Fastest Pit Stop', holder: 'McLaren (2023)', value: '1.80s', iconKey: 'pitstop' },
        { record: 'Longest Race (Distance)', holder: '2011 Canadian GP', value: '4:04:39', iconKey: 'circuit' },
        { record: 'Most Laps Led (Career)', holder: 'Lewis Hamilton', value: '5455', iconKey: 'flag' },
        { record: 'Highest Top Speed (Race)', holder: 'Valtteri Bottas (2016)', value: '372.5 km/h', iconKey: 'speed' },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}><StatsIcon size={28} color="#E10600" /></div>
                        <div>
                            <h1 className={styles.title}>F1 Records</h1>
                            <p className={styles.subtitle}>Fastest laps and all-time world records</p>
                        </div>
                    </div>
                    <select
                        className={styles.seasonSelect}
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
                        <option value="current">LIVE 2026 SEASON</option>
                        <option value="2025">2025 Season</option>
                        <option value="2024">2024 Season</option>
                        <option value="2023">2023 Season</option>
                        <option value="2022">2022 Season</option>
                        <option value="2021">2021 Season</option>
                        <option value="2020">2020 Season</option>
                        <option value="2019">2019 Season</option>
                    </select>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'fastest' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('fastest')}
                    >
                        <SpeedometerIcon size={16} color={activeTab === 'fastest' ? '#E10600' : 'currentColor'} />
                        <span>Fastest Laps</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <TrophyIcon size={16} color={activeTab === 'history' ? '#E10600' : 'currentColor'} />
                        <span>All-Time Records</span>
                    </button>
                </div>

                {loading && activeTab !== 'history' ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <p>Loading records...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'fastest' && (
                            <div className={styles.fastestSection}>
                                <div className={styles.fastestGrid}>
                                    {fastestLaps.map((lap, i) => (
                                        <div key={i} className={styles.fastestCard}>
                                            <div className={styles.fastestHeader}>
                                                <SpeedometerIcon size={14} color="rgba(255,255,255,0.3)" />
                                                <span className={styles.fastestRace}>{lap.raceName}</span>
                                            </div>
                                            <div className={styles.fastestDriver}>
                                                <div className={styles.fastestTeamBar} style={{ background: getTeamColor(lap.constructorId) }} />
                                                <div>
                                                    <span className={styles.fastestName}>{lap.driver}</span>
                                                    <span className={styles.fastestTeam}>{lap.constructor}</span>
                                                </div>
                                            </div>
                                            <div className={styles.fastestStats}>
                                                <div>
                                                    <span className={styles.fastestLabel}>
                                                        <ClockIcon size={10} color="rgba(255,255,255,0.3)" /> Lap Time
                                                    </span>
                                                    <span className={styles.fastestTime}>{lap.time}</span>
                                                </div>
                                                <div>
                                                    <span className={styles.fastestLabel}>
                                                        <SpeedometerIcon size={10} color="rgba(255,255,255,0.3)" /> Avg Speed
                                                    </span>
                                                    <span className={styles.fastestSpeed}>{lap.speed} km/h</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {fastestLaps.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <SpeedometerIcon size={48} color="rgba(255,255,255,0.2)" />
                                        <h3 className={styles.emptyTitle}>No Fastest Lap Data Yet</h3>
                                        <p className={styles.emptyDesc}>Fastest lap records will appear here once races begin.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className={styles.historySection}>
                                <div className={styles.recordsGrid}>
                                    {historicalRecords.map((record, i) => (
                                        <div key={i} className={styles.recordCard} style={{ animationDelay: `${i * 50}ms` }}>
                                            <div className={styles.recordIconWrap}>
                                                <div className={styles.recordIconInner} style={{ background: `linear-gradient(135deg, ${(recordIcons[record.iconKey] as any).props?.color}22, transparent)` }}>
                                                    {recordIcons[record.iconKey]}
                                                </div>
                                            </div>
                                            <div className={styles.recordInfo}>
                                                <span className={styles.recordTitle}>{record.record}</span>
                                                <span className={styles.recordHolder}>{record.holder}</span>
                                            </div>
                                            <span className={styles.recordValue} style={{ color: (recordIcons[record.iconKey] as any).props?.color }}>
                                                {record.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div >
        </div >
    );
}

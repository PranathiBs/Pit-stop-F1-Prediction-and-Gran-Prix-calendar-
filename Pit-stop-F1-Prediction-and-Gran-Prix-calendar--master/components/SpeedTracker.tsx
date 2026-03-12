'use client';

import React, { useState, useEffect } from 'react';
import styles from './SpeedTracker.module.css';
import { SpeedometerIcon, PitStopIcon } from './Icons';

interface SpeedTrap {
    driver: string;
    team: string;
    speed: number;
    session: string;
    circuit: string;
    year: number;
}

interface PitStopRecord {
    team: string;
    time: number;
    race: string;
    year: number;
}

// Curated 2025-2026 data
const topSpeeds: SpeedTrap[] = [
    { driver: 'Max Verstappen', team: 'Red Bull', speed: 370.1, session: 'Race', circuit: 'Monza', year: 2025 },
    { driver: 'Lewis Hamilton', team: 'Ferrari', speed: 368.3, session: 'Qualifying', circuit: 'Baku', year: 2025 },
    { driver: 'Lando Norris', team: 'McLaren', speed: 365.8, session: 'Race', circuit: 'Jeddah', year: 2025 },
    { driver: 'Carlos Sainz', team: 'Williams', speed: 363.2, session: 'Race', circuit: 'Spa', year: 2025 },
    { driver: 'Charles Leclerc', team: 'Ferrari', speed: 361.5, session: 'Qualifying', circuit: 'Monza', year: 2025 },
    { driver: 'George Russell', team: 'Mercedes', speed: 359.8, session: 'Race', circuit: 'Mexico', year: 2025 },
    { driver: 'Fernando Alonso', team: 'Aston Martin', speed: 358.4, session: 'Race', circuit: 'Las Vegas', year: 2025 },
    { driver: 'Oscar Piastri', team: 'McLaren', speed: 357.9, session: 'Qualifying', circuit: 'Jeddah', year: 2025 },
];

const pitStopRecords: PitStopRecord[] = [
    { team: 'Red Bull Racing', time: 1.82, race: 'Brazilian GP', year: 2024 },
    { team: 'McLaren', time: 1.92, race: 'Monaco GP', year: 2024 },
    { team: 'Williams', time: 1.95, race: 'British GP', year: 2024 },
    { team: 'Red Bull Racing', time: 1.97, race: 'Austrian GP', year: 2025 },
    { team: 'Ferrari', time: 2.04, race: 'Italian GP', year: 2024 },
    { team: 'Mercedes', time: 2.08, race: 'Singapore GP', year: 2025 },
    { team: 'McLaren', time: 2.11, race: 'Japanese GP', year: 2025 },
    { team: 'Aston Martin', time: 2.15, race: 'Canadian GP', year: 2025 },
];

export default function SpeedTracker() {
    const [activeTab, setActiveTab] = useState<'speed' | 'pits'>('speed');
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const maxSpeed = topSpeeds[0]?.speed || 370;
    const maxPitTime = 2.5;

    return (
        <div className={styles.tracker}>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'speed' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('speed')}
                >
                    <SpeedometerIcon size={14} color={activeTab === 'speed' ? '#a0d9f8' : 'currentColor'} />
                    <span>Speed Trap</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'pits' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('pits')}
                >
                    <PitStopIcon size={14} color={activeTab === 'pits' ? '#a0d9f8' : 'currentColor'} />
                    <span>Pit Stops</span>
                </button>
            </div>

            {activeTab === 'speed' && (
                <div className={styles.list}>
                    {topSpeeds.map((entry, i) => {
                        const pct = animate ? ((entry.speed / maxSpeed) * 100) : 0;
                        return (
                            <div key={i} className={styles.row} style={{ animationDelay: `${i * 80}ms` }}>
                                <span className={`${styles.rank} ${i < 3 ? styles.topRank : ''}`}>{i + 1}</span>
                                <div className={styles.info}>
                                    <span className={styles.name}>{entry.driver}</span>
                                    <span className={styles.meta}>{entry.team} • {entry.circuit}</span>
                                </div>
                                <div className={styles.barArea}>
                                    <div className={styles.barBg}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                width: `${pct}%`,
                                                background: i === 0 ? 'linear-gradient(90deg, #a0d9f8, #3a5bbf)' :
                                                    i < 3 ? 'linear-gradient(90deg, #a0d9f8, rgba(160,217,248,0.5))' :
                                                        'rgba(255,255,255,0.15)',
                                                transitionDelay: `${i * 100}ms`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className={`${styles.value} ${i === 0 ? styles.topValue : ''}`}>
                                    {entry.speed.toFixed(1)}
                                    <span className={styles.unit}>km/h</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'pits' && (
                <div className={styles.list}>
                    {pitStopRecords.map((entry, i) => {
                        const pct = animate ? ((1 - (entry.time / maxPitTime)) * 100 + 20) : 0;
                        return (
                            <div key={i} className={styles.row} style={{ animationDelay: `${i * 80}ms` }}>
                                <span className={`${styles.rank} ${i < 3 ? styles.topRank : ''}`}>{i + 1}</span>
                                <div className={styles.info}>
                                    <span className={styles.name}>{entry.team}</span>
                                    <span className={styles.meta}>{entry.race} {entry.year}</span>
                                </div>
                                <div className={styles.barArea}>
                                    <div className={styles.barBg}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                width: `${pct}%`,
                                                background: i === 0 ? 'linear-gradient(90deg, #39B54A, #66cc33)' :
                                                    i < 3 ? 'linear-gradient(90deg, #39B54A, rgba(57,181,74,0.5))' :
                                                        'rgba(255,255,255,0.15)',
                                                transitionDelay: `${i * 100}ms`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className={`${styles.value} ${i === 0 ? styles.topValueGreen : ''}`}>
                                    {entry.time.toFixed(2)}
                                    <span className={styles.unit}>sec</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

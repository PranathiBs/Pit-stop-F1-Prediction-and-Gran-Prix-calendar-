'use client';

import React, { useState, useEffect } from 'react';
import styles from './DriverComparison.module.css';
import { getDriverStandings, DriverStanding } from '@/lib/f1-api';
import { getTeamColor } from '@/lib/team-colors';
import { HelmetIcon, BoltIcon } from './Icons';

export default function DriverComparison() {
    const [drivers, setDrivers] = useState<DriverStanding[]>([]);
    const [driver1, setDriver1] = useState<string>('');
    const [driver2, setDriver2] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch_data() {
            const data = await getDriverStandings('current');
            setDrivers(data);
            if (data.length >= 2) {
                setDriver1(data[0].Driver.driverId);
                setDriver2(data[1].Driver.driverId);
            }
            setLoading(false);
        }
        fetch_data();
    }, []);

    const d1 = drivers.find(d => d.Driver.driverId === driver1);
    const d2 = drivers.find(d => d.Driver.driverId === driver2);

    if (loading || !d1 || !d2) return null;

    const maxPoints = Math.max(parseFloat(d1.points), parseFloat(d2.points));
    const d1Pct = (parseFloat(d1.points) / maxPoints) * 100;
    const d2Pct = (parseFloat(d2.points) / maxPoints) * 100;
    const d1Color = getTeamColor(d1.Constructors[0]?.constructorId || '');
    const d2Color = getTeamColor(d2.Constructors[0]?.constructorId || '');

    const comparisons = [
        { label: 'Points', v1: d1.points, v2: d2.points, type: 'number' },
        { label: 'Wins', v1: d1.wins, v2: d2.wins, type: 'number' },
        { label: 'Position', v1: d1.position, v2: d2.position, type: 'position' },
    ];

    return (
        <div className={styles.comparison}>
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <BoltIcon size={18} color="#E10600" />
                    <span>Head-to-Head</span>
                </h3>
            </div>

            {/* Driver Selectors */}
            <div className={styles.selectors}>
                <div className={styles.selectorGroup}>
                    <div className={styles.selectorStripe} style={{ background: d1Color }} />
                    <select
                        value={driver1}
                        onChange={(e) => setDriver1(e.target.value)}
                        className={styles.selector}
                        style={{ borderColor: d1Color }}
                    >
                        {drivers.map(d => (
                            <option key={d.Driver.driverId} value={d.Driver.driverId}>
                                {d.Driver.givenName} {d.Driver.familyName}
                            </option>
                        ))}
                    </select>
                    <span className={styles.selectorTeam}>{d1.Constructors[0]?.name}</span>
                </div>

                <div className={styles.vsCircle}>
                    <span>VS</span>
                </div>

                <div className={styles.selectorGroup}>
                    <div className={styles.selectorStripe} style={{ background: d2Color }} />
                    <select
                        value={driver2}
                        onChange={(e) => setDriver2(e.target.value)}
                        className={styles.selector}
                        style={{ borderColor: d2Color }}
                    >
                        {drivers.map(d => (
                            <option key={d.Driver.driverId} value={d.Driver.driverId}>
                                {d.Driver.givenName} {d.Driver.familyName}
                            </option>
                        ))}
                    </select>
                    <span className={styles.selectorTeam}>{d2.Constructors[0]?.name}</span>
                </div>
            </div>

            {/* Points Bar Duel */}
            <div className={styles.barDuel}>
                <div className={styles.barRow}>
                    <div className={styles.barLabel}>
                        <HelmetIcon size={14} color={d1Color} />
                        <span>{d1.Driver.code || d1.Driver.familyName.substring(0, 3).toUpperCase()}</span>
                    </div>
                    <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${d1Pct}%`, background: d1Color }} />
                    </div>
                    <span className={styles.barValue}>{d1.points}</span>
                </div>
                <div className={styles.barRow}>
                    <div className={styles.barLabel}>
                        <HelmetIcon size={14} color={d2Color} />
                        <span>{d2.Driver.code || d2.Driver.familyName.substring(0, 3).toUpperCase()}</span>
                    </div>
                    <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${d2Pct}%`, background: d2Color }} />
                    </div>
                    <span className={styles.barValue}>{d2.points}</span>
                </div>
            </div>

            {/* Comparison Stats */}
            <div className={styles.stats}>
                {comparisons.map(comp => {
                    const v1 = parseFloat(comp.v1);
                    const v2 = parseFloat(comp.v2);
                    const winner = comp.type === 'position' ? (v1 < v2 ? 1 : v2 < v1 ? 2 : 0) : (v1 > v2 ? 1 : v2 > v1 ? 2 : 0);

                    return (
                        <div key={comp.label} className={styles.statRow}>
                            <span className={`${styles.statVal} ${winner === 1 ? styles.statWin : ''}`} style={winner === 1 ? { color: d1Color } : {}}>
                                {comp.type === 'position' ? `P${comp.v1}` : comp.v1}
                            </span>
                            <span className={styles.statLabel}>{comp.label}</span>
                            <span className={`${styles.statVal} ${winner === 2 ? styles.statWin : ''}`} style={winner === 2 ? { color: d2Color } : {}}>
                                {comp.type === 'position' ? `P${comp.v2}` : comp.v2}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './standings.module.css';
import {
    getDriverStandings, getConstructorStandings,
    DriverStanding, ConstructorStanding
} from '@/lib/f1-api';
import { getTeamColor } from '@/lib/team-colors';
import { Trophy, Users, Shield, Award, Activity, Search, Car } from 'lucide-react';

export default function StandingsPage() {
    const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
    const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
    const [activeTab, setActiveTab] = useState<'drivers' | 'constructors'>('drivers');
    const [loading, setLoading] = useState(true);
    const [season, setSeason] = useState('current');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [drivers, constructors] = await Promise.all([
            getDriverStandings(season),
            getConstructorStandings(season),
        ]);
        setDriverStandings(drivers);
        setConstructorStandings(constructors);
        setLoading(false);
    }, [season]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const maxDriverPoints = driverStandings[0] ? parseFloat(driverStandings[0].points) : 1;
    const maxConstructorPoints = constructorStandings[0] ? parseFloat(constructorStandings[0].points) : 1;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}><Trophy size={28} color="#E10600" /></div>
                        <div>
                            <h1 className={styles.title}>Championship Standings</h1>
                            <p className={styles.subtitle}>
                                {season === 'current' ? new Date().getFullYear() : season} FIA Formula 1 World Championship
                            </p>
                        </div>
                    </div>
                    <select
                        className={styles.seasonSelect}
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                    >
                        <option value="current">{new Date().getFullYear()}</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                    </select>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'drivers' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('drivers')}
                    >
                        <Users size={16} color={activeTab === 'drivers' ? '#E10600' : 'currentColor'} />
                        <span>Drivers</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'constructors' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('constructors')}
                    >
                        <Shield size={16} color={activeTab === 'constructors' ? '#E10600' : 'currentColor'} />
                        <span>Constructors</span>
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <p>Loading standings...</p>
                    </div>
                ) : (
                    <>
                        {/* Driver Standings */}
                        {activeTab === 'drivers' && (
                            <div className={styles.standingsTable}>
                                {/* Top 3 Podium */}
                                <div className={styles.podium}>
                                    {driverStandings.slice(0, 3).map((standing, i) => {
                                        const teamColor = getTeamColor(standing.Constructors[0]?.constructorId || '');
                                        return (
                                            <div
                                                key={standing.Driver.driverId}
                                                className={`${styles.podiumCard} ${styles[`podiumPos${i + 1}`]}`}
                                                style={{ '--team-color': teamColor } as React.CSSProperties}
                                            >
                                                <div className={styles.podiumPosition}>
                                                    <Trophy size={28} color={i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32'} />
                                                </div>
                                                <div className={styles.podiumNumber}>#{standing.Driver.permanentNumber}</div>
                                                <div className={styles.podiumName}>
                                                    <span className={styles.firstName}>{standing.Driver.givenName}</span>
                                                    <span className={styles.lastName}>{standing.Driver.familyName}</span>
                                                </div>
                                                <div className={styles.podiumTeam}>{standing.Constructors[0]?.name}</div>
                                                <div className={styles.podiumPoints}>{standing.points}</div>
                                                <div className={styles.podiumLabel}>POINTS</div>
                                                <div className={styles.podiumWins}>{standing.wins} WINS</div>
                                                <div
                                                    className={styles.podiumStripe}
                                                    style={{ background: teamColor }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Rest of drivers */}
                                <div className={styles.driversList}>
                                    {driverStandings.slice(3).map((standing) => {
                                        const teamColor = getTeamColor(standing.Constructors[0]?.constructorId || '');
                                        const pointsPercent = (parseFloat(standing.points) / maxDriverPoints) * 100;

                                        return (
                                            <div key={standing.Driver.driverId} className={styles.driverRow}>
                                                <span className={styles.driverPos}>{standing.position}</span>
                                                <div className={styles.driverStripe} style={{ background: teamColor }} />
                                                <div className={styles.driverInfo}>
                                                    <span className={styles.driverFullName}>
                                                        {standing.Driver.givenName} <strong>{standing.Driver.familyName}</strong>
                                                    </span>
                                                    <span className={styles.driverTeam}>{standing.Constructors[0]?.name}</span>
                                                </div>
                                                <div className={styles.pointsBar}>
                                                    <div
                                                        className={styles.pointsFill}
                                                        style={{ width: `${pointsPercent}%`, background: teamColor }}
                                                    />
                                                </div>
                                                <div className={styles.driverPoints}>
                                                    <span className={styles.pointsNum}>{standing.points}</span>
                                                    <span className={styles.pointsLabel}>PTS</span>
                                                </div>
                                                <span className={styles.driverWins}>{standing.wins}W</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {activeTab === 'drivers' && driverStandings.length === 0 && (
                            <div className={styles.emptyState}>
                                <Car size={56} color="rgba(255,255,255,0.15)" />
                                <h3 className={styles.emptyTitle}>No Race Results Yet</h3>
                                <p className={styles.emptyDesc}>The {season === 'current' ? new Date().getFullYear() : season} season hasn&apos;t started yet. Championship standings will appear here after the first race.</p>
                            </div>
                        )}

                        {/* Constructor Standings */}
                        {activeTab === 'constructors' && (
                            <div className={styles.standingsTable}>
                                <div className={styles.constructorsList}>
                                    {constructorStandings.map((standing) => {
                                        const teamColor = getTeamColor(standing.Constructor.constructorId);
                                        const pointsPercent = (parseFloat(standing.points) / maxConstructorPoints) * 100;

                                        return (
                                            <div
                                                key={standing.Constructor.constructorId}
                                                className={styles.constructorRow}
                                                style={{ '--team-color': teamColor } as React.CSSProperties}
                                            >
                                                <span className={`${styles.constructorPos} ${parseInt(standing.position) <= 3 ? styles.topConstructor : ''}`}>
                                                    {standing.position}
                                                </span>
                                                <div className={styles.constructorStripe} style={{ background: teamColor }} />
                                                <div className={styles.constructorInfo}>
                                                    <span className={styles.constructorName}>{standing.Constructor.name}</span>
                                                    <span className={styles.constructorNat}>{standing.Constructor.nationality}</span>
                                                </div>
                                                <div className={styles.constructorBar}>
                                                    <div
                                                        className={styles.constructorFill}
                                                        style={{ width: `${pointsPercent}%`, background: teamColor }}
                                                    />
                                                </div>
                                                <div className={styles.constructorPoints}>
                                                    <span className={styles.constructorPts}>{standing.points}</span>
                                                    <span className={styles.constructorPtsLabel}>PTS</span>
                                                </div>
                                                <span className={styles.constructorWins}>{standing.wins}W</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {activeTab === 'constructors' && constructorStandings.length === 0 && (
                            <div className={styles.emptyState}>
                                <Shield size={56} color="rgba(255,255,255,0.15)" />
                                <h3 className={styles.emptyTitle}>No Constructor Results Yet</h3>
                                <p className={styles.emptyDesc}>Constructor standings will appear here after the first race of the {season === 'current' ? new Date().getFullYear() : season} season.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './calendar.module.css';
import { Race, getRaceSchedule } from '@/lib/f1-api';
import { getCurrentWeather, getWeatherEmoji, WeatherData } from '@/lib/weather-api';
import { getCircuitDetail } from '@/lib/circuit-data';
import { Flag as FlagIcon, Trophy, Timer, CheckCircle, Info, Award, Clock, Car } from 'lucide-react';

function CalendarContent() {
    const [races, setRaces] = useState<Race[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState('current');
    const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});

    const searchParams = useSearchParams();
    const initialFilter = searchParams.get('filter') as 'all' | 'upcoming' | 'completed' | null;
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>(initialFilter || 'all');

    useEffect(() => {
        if (initialFilter) setFilter(initialFilter);
    }, [initialFilter]);

    const fetchRaces = useCallback(async () => {
        setLoading(true);
        const data = await getRaceSchedule(selectedYear);
        setRaces(data);
        setLoading(false);

        const now = new Date();
        const upcoming = data.filter((r: Race) => new Date(r.date) > now).slice(0, 5);
        const weatherPromises = upcoming.map(async (race: Race) => {
            const weather = await getCurrentWeather(
                race.Circuit.Location.lat,
                race.Circuit.Location.long
            );
            return { circuitId: race.Circuit.circuitId, weather };
        });

        const results = await Promise.all(weatherPromises);
        const newWeather: { [key: string]: WeatherData } = {};
        results.forEach(r => {
            if (r.weather) newWeather[r.circuitId] = r.weather;
        });
        setWeatherData(newWeather);
    }, [selectedYear]);

    useEffect(() => {
        fetchRaces();
    }, [fetchRaces]);

    const now = new Date();
    const filteredRaces = races.filter(race => {
        const raceDate = new Date(race.date);
        if (filter === 'upcoming') return raceDate >= now;
        if (filter === 'completed') return raceDate < now;
        return true;
    });

    const nextRaceIndex = races.findIndex(r => new Date(r.date) >= now);

    // Scroll pop-up observer
    const gridRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.raceCardVisible);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        const cards = gridRef.current?.querySelectorAll(`.${styles.raceCard}`);
        cards?.forEach((card) => observer.observe(card));
        return () => observer.disconnect();
    }, [filteredRaces, loading]);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Season Calendar</h1>
                        <p className={styles.subtitle}>{selectedYear === 'current' ? new Date().getFullYear() : selectedYear} Formula 1 Official Schedule</p>
                    </div>
                    <div className={styles.controls}>
                        <div className={styles.filterGroup}>
                            {(['all', 'upcoming', 'completed'] as const).map(f => (
                                <button
                                    key={f}
                                    className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                        <select
                            className={styles.yearSelect}
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="current">{new Date().getFullYear()}</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingGrid}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonHeader} />
                                <div className={styles.skeletonBody}>
                                    <div className={styles.skeletonLine} />
                                    <div className={styles.skeletonLineShort} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredRaces.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyCar}>
                            <Car size={100} color="rgba(255,255,255,0.05)" />
                        </div>
                        <h3>No Race Events Found</h3>
                        <p>No matches for "{filter}" Grand Prix in {selectedYear === 'current' ? 'the current season' : selectedYear}.</p>
                        <button
                            className={styles.resetBtn}
                            onClick={() => { setFilter('all'); setSelectedYear('current'); }}
                        >
                            View All Races
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={styles.statusBanner}>
                            {filter === 'completed' && (
                                <div className={`${styles.bannerContent} ${styles.completedTag}`}>
                                    <Trophy size={20} color="#39B54A" />
                                    <div className={styles.bannerText}>
                                        <strong>Past Results Official</strong>
                                        <span>Viewing finalized race data and podium records for the selected season.</span>
                                    </div>
                                </div>
                            )}
                            {filter === 'upcoming' && (
                                <div className={`${styles.bannerContent} ${styles.upcomingTag}`}>
                                    <Timer size={20} color="#E10600" />
                                    <div className={styles.bannerText}>
                                        <strong>Upcoming Grand Prix</strong>
                                        <span>Tracking the next rounds of the championship. Schedule subject to FIA updates.</span>
                                    </div>
                                </div>
                            )}
                            {filter === 'all' && (
                                <div className={`${styles.bannerContent} ${styles.infoTag}`}>
                                    <Info size={20} color="rgba(255,255,255,0.6)" />
                                    <div className={styles.bannerText}>
                                        <strong>Full Season View</strong>
                                        <span>Complete schedule for the {selectedYear === 'current' ? new Date().getFullYear() : selectedYear} FIA Formula 1 World Championship.</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.raceGrid} ref={gridRef}>
                            {filteredRaces.map((race, index) => {
                                const raceDate = new Date(race.date);
                                const isPast = raceDate < now;
                                const isNext = races.indexOf(race) === nextRaceIndex;
                                const circuit = getCircuitDetail(race.Circuit.circuitId);
                                const weather = weatherData[race.Circuit.circuitId];

                                return (
                                    <Link
                                        key={`${race.season}-${race.round}`}
                                        href={`/circuit/${race.Circuit.circuitId}`}
                                        className={`${styles.raceCard} ${isPast ? styles.pastCard : ''} ${isNext ? styles.nextCard : ''} ${styles.raceCardPop}`}
                                        style={{ animationDelay: `${index % 6 * 0.1}s` }}
                                    >
                                        {isNext && (
                                            <div className={styles.nextBadge}>
                                                <span className={styles.nextDot} />
                                                LIVE TRACK
                                            </div>
                                        )}

                                        <div className={styles.raceHeader}>
                                            <span className={styles.round}>R{race.round.padStart(2, '0')}</span>
                                            <span className={styles.flag}>
                                                <FlagIcon size={14} color={circuit?.color || '#E10600'} />
                                            </span>
                                        </div>

                                        <h3 className={styles.raceName}>{race.raceName}</h3>
                                        <p className={styles.circuitName}>{race.Circuit.circuitName}</p>
                                        <p className={styles.location}>
                                            {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                                        </p>

                                        <div className={styles.raceDate}>
                                            <span className={styles.dateDay}>
                                                {raceDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                            <span className={styles.dateNum}>
                                                {raceDate.getDate()}
                                            </span>
                                            <span className={styles.dateMonth}>
                                                {raceDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>

                                        {weather && !isPast && (
                                            <div className={styles.weatherBadge}>
                                                <span>{getWeatherEmoji(weather.main)}</span>
                                                <span>{weather.temp}°C</span>
                                            </div>
                                        )}

                                        {isPast && (
                                            <div className={styles.completedBadge}><CheckCircle size={12} style={{ marginRight: 4 }} /> Official</div>
                                        )}

                                        <div className={styles.cardStripe} style={{ background: circuit?.color || '#E10600' }} />
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function CalendarPage() {
    return (
        <Suspense fallback={<div>Loading Race Calendar...</div>}>
            <CalendarContent />
        </Suspense>
    );
}

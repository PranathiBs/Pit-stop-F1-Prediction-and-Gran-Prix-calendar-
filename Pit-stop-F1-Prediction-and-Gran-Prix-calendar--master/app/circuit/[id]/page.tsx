'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './circuit.module.css';
import { getCircuitDetail, CircuitDetail, getCircuitImage } from '@/lib/circuit-data';
import { getCurrentWeather, getForecast, getWeatherEmoji, WeatherData, ForecastDay } from '@/lib/weather-api';
import { getCircuitInfo, getRaceResults, Circuit, Race } from '@/lib/f1-api';
import { predictStrategy, mapCircuitId, CIRCUIT_DATA, getTyreColor, getTyreShort, Strategy } from '@/lib/tyre-strategy';
import { getTeamColor } from '@/lib/team-colors';
import {
    CircuitIcon, SpeedometerIcon, FlagIcon, ClockIcon, CalendarIcon,
    TrophyIcon, WeatherIcon, RacingCarIcon, TyreIcon, BoltIcon, MedalIcon
} from '@/components/Icons';

export default function CircuitPage() {
    const params = useParams();
    const circuitId = params.id as string;

    const [circuitDetail, setCircuitDetail] = useState<CircuitDetail | null>(null);
    const [circuitApi, setCircuitApi] = useState<Circuit | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [forecast, setForecast] = useState<ForecastDay[]>([]);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [pastResults, setPastResults] = useState<Race[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImageExpanded, setIsImageExpanded] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Get circuit details
            const detail = getCircuitDetail(circuitId);
            setCircuitDetail(detail);

            // Get API circuit info
            const apiInfo = await getCircuitInfo(circuitId);
            setCircuitApi(apiInfo);

            // Get coordinates
            const lat = apiInfo?.Location.lat || detail?.id ? '0' : '0';
            const lon = apiInfo?.Location.long || '0';

            // Fetch weather
            if (lat !== '0') {
                const [weatherData, forecastData] = await Promise.all([
                    getCurrentWeather(lat, lon),
                    getForecast(lat, lon),
                ]);
                setWeather(weatherData);
                setForecast(forecastData);

                // Predict strategies
                if (weatherData) {
                    const mappedId = mapCircuitId(circuitId);
                    const strategyPredictions = predictStrategy(mappedId, weatherData);
                    setStrategies(strategyPredictions);
                }
            }

            // Get past race results
            try {
                const results = await getRaceResults('current');
                const circuitResults = results.filter((r: Race) => r.Circuit.circuitId === circuitId);
                setPastResults(circuitResults);
            } catch {
                // Ignore - might not have results yet
            }
        } catch (error) {
            console.error('Error loading circuit:', error);
        } finally {
            setLoading(false);
        }
    }, [circuitId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const trackData = CIRCUIT_DATA[mapCircuitId(circuitId)];

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner} />
                <p>Loading circuit data...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Hero Header */}
            <section className={styles.hero} style={{ '--accent': circuitDetail?.color || '#a0d9f8' } as React.CSSProperties}>
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <Link href="/calendar" className={styles.backLink}>← Back to Calendar</Link>
                    <div className={styles.heroMain}>
                        <div className={styles.heroInfo}>
                            <span className={styles.heroFlag}>{circuitDetail?.flagEmoji || ''}</span>
                            <h1 className={styles.heroTitle}>
                                {circuitDetail?.name || circuitApi?.circuitName || circuitId}
                            </h1>
                            <p className={styles.heroLocation}>
                                {circuitDetail?.city || circuitApi?.Location.locality}, {circuitDetail?.country || circuitApi?.Location.country}
                            </p>
                            {circuitDetail && (
                                <p className={styles.heroDescription}>{circuitDetail.description}</p>
                            )}
                        </div>

                        {/* Track Map */}
                        <div className={styles.trackMap} onClick={() => setIsImageExpanded(true)}>
                            <div className={styles.circuitImageWrap}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getCircuitImage(circuitId)}
                                    alt={circuitDetail?.name || 'Circuit Map'}
                                    className={styles.circuitImage}
                                />
                                <div className={styles.expandHint}>Click to Expand</div>
                            </div>

                            {/* Optional: Path overlay if desired, but user said the current one is 'wrong' 
                                so we'll only show the official image for now to be safe. */}
                        </div>
                    </div>
                </div>
            </section>

            <div className={styles.container}>
                {/* Track Stats */}
                <section className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><CircuitIcon size={20} color="#a0d9f8" /></span>
                        <span className={styles.statValue}>{circuitDetail?.length || 'N/A'}</span>
                        <span className={styles.statLabel}>Track Length</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><SpeedometerIcon size={20} color="#FFC906" /></span>
                        <span className={styles.statValue}>{circuitDetail?.turns || 'N/A'}</span>
                        <span className={styles.statLabel}>Corners</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><BoltIcon size={20} color="#39B54A" /></span>
                        <span className={styles.statValue}>{circuitDetail?.drsZones || 'N/A'}</span>
                        <span className={styles.statLabel}>DRS Zones</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><ClockIcon size={20} color="#2293D1" /></span>
                        <span className={styles.statValue}>{circuitDetail?.lapRecord.time || 'N/A'}</span>
                        <span className={styles.statLabel}>Lap Record</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><CalendarIcon size={20} color="#F58020" /></span>
                        <span className={styles.statValue}>{circuitDetail?.firstGP || 'N/A'}</span>
                        <span className={styles.statLabel}>First GP</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><CircuitIcon size={20} color="#9B59B6" /></span>
                        <span className={styles.statValue}>{circuitDetail?.altitude || 'N/A'}</span>
                        <span className={styles.statLabel}>Altitude</span>
                    </div>
                    {trackData && (
                        <>
                            <div className={styles.statCard}>
                                <span className={styles.statIcon}><FlagIcon size={20} color="#a0d9f8" /></span>
                                <span className={styles.statValue}>{trackData.totalLaps}</span>
                                <span className={styles.statLabel}>Race Laps</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statIcon}><ClockIcon size={20} color="#FFC906" /></span>
                                <span className={styles.statValue}>{trackData.pitLossSeconds}s</span>
                                <span className={styles.statLabel}>Pit Loss</span>
                            </div>
                        </>
                    )}
                </section>

                {circuitDetail?.lapRecord && (
                    <section className={styles.lapRecordSection}>
                        <div className={styles.lapRecordCard}>
                            <span className={styles.lapRecordIcon}><TrophyIcon size={28} color="#FFD700" /></span>
                            <div>
                                <span className={styles.lapRecordTitle}>Lap Record</span>
                                <span className={styles.lapRecordTime}>{circuitDetail.lapRecord.time}</span>
                                <span className={styles.lapRecordDriver}>
                                    {circuitDetail.lapRecord.driver} ({circuitDetail.lapRecord.year})
                                </span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Weather Section */}
                <section className={styles.weatherSection}>
                    <h2 className={styles.sectionTitle}><WeatherIcon size={22} color="#2293D1" /> Weather Forecast</h2>

                    {weather && (
                        <div className={styles.currentWeather}>
                            <div className={styles.weatherMain}>
                                <span className={styles.weatherEmoji}>{getWeatherEmoji(weather.main)}</span>
                                <div>
                                    <div className={styles.weatherTemp}>{weather.temp}°C</div>
                                    <div className={styles.weatherCondition}>{weather.description}</div>
                                </div>
                            </div>
                            <div className={styles.weatherGrid}>
                                <div className={styles.weatherItem}>
                                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 1 1 4 0z"/></svg></span>
                                    <span>Feels Like</span>
                                    <span>{weather.feels_like}°C</span>
                                </div>
                                <div className={styles.weatherItem}>
                                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4-4 6-7.5 6-10.5a6 6 0 1 0-12 0C6 14.5 8 18 12 22z"/></svg></span>
                                    <span>Humidity</span>
                                    <span>{weather.humidity}%</span>
                                </div>
                                <div className={styles.weatherItem}>
                                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg></span>
                                    <span>Wind</span>
                                    <span>{weather.wind_speed.toFixed(1)} m/s</span>
                                </div>
                                <div className={styles.weatherItem}>
                                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg></span>
                                    <span>Rain Prob.</span>
                                    <span>{weather.rain_probability}%</span>
                                </div>
                                <div className={styles.weatherItem}>
                                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></svg></span>
                                    <span>Cloud Cover</span>
                                    <span>{weather.clouds}%</span>
                                </div>
                                <div className={styles.weatherItem}>
                                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E44AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></span>
                                    <span>Visibility</span>
                                    <span>{(weather.visibility / 1000).toFixed(1)} km</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {forecast.length > 0 && (
                        <div className={styles.forecastGrid}>
                            {forecast.map((day) => (
                                <div key={day.date} className={styles.forecastCard}>
                                    <div className={styles.forecastDay}>{day.day_name}</div>
                                    <div className={styles.forecastIcon}>
                                        {getWeatherEmoji(day.weather.main)}
                                    </div>
                                    <div className={styles.forecastTemps}>
                                        <span className={styles.tempHigh}>{day.temp_max}°</span>
                                        <span className={styles.tempLow}>{day.temp_min}°</span>
                                    </div>
                                    <div className={styles.forecastDesc}>{day.weather.description}</div>
                                    {day.weather.rain_probability > 20 && (
                                        <div className={styles.forecastRain}>
                                            Rain: {Math.round(day.weather.rain_probability)}%
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Tyre Strategy Section */}
                {strategies.length > 0 && (
                    <section className={styles.strategySection}>
                        <h2 className={styles.sectionTitle}><TyreIcon size={22} color="#a0d9f8" /> Predicted Tyre Strategy</h2>
                        <p className={styles.strategySubtitle}>
                            Based on current weather conditions and track characteristics
                        </p>

                        <div className={styles.strategyGrid}>
                            {strategies.map((strategy, i) => (
                                <div
                                    key={i}
                                    className={`${styles.strategyCard} ${strategy.recommended ? styles.recommended : ''}`}
                                >
                                    {strategy.recommended && (
                                        <div className={styles.recommendedBadge}><MedalIcon size={14} color="#FFD700" /> RECOMMENDED</div>
                                    )}

                                    <div className={styles.strategyHeader}>
                                        <h3 className={styles.strategyName}>{strategy.name}</h3>
                                        <div className={styles.strategyMeta}>
                                            <span className={`${styles.riskBadge} ${styles[`risk${strategy.riskLevel}`]}`}>
                                                {strategy.riskLevel} RISK
                                            </span>
                                            <span className={styles.stopsBadge}>
                                                {strategy.totalStops} STOP{strategy.totalStops !== 1 ? 'S' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <p className={styles.strategyDesc}>{strategy.description}</p>

                                    {/* Timeline visualisation */}
                                    <div className={styles.timeline}>
                                        {strategy.stints.map((stint, j) => {
                                            const totalLaps = strategy.stints.reduce((s, st) => s + st.laps, 0);
                                            const widthPercent = (stint.laps / totalLaps) * 100;
                                            return (
                                                <div
                                                    key={j}
                                                    className={styles.timelineStint}
                                                    style={{
                                                        width: `${widthPercent}%`,
                                                        backgroundColor: getTyreColor(stint.compound),
                                                    }}
                                                    title={`${stint.compound}: Lap ${stint.startLap}-${stint.endLap} (${stint.laps} laps)`}
                                                >
                                                    <span className={styles.stintLabel}>{getTyreShort(stint.compound)}</span>
                                                    <span className={styles.stintLaps}>{stint.laps}L</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Stint details */}
                                    <div className={styles.stintDetails}>
                                        {strategy.stints.map((stint, j) => (
                                            <div key={j} className={styles.stintRow}>
                                                <div
                                                    className={styles.stintCompound}
                                                    style={{ borderColor: getTyreColor(stint.compound), color: getTyreColor(stint.compound) }}
                                                >
                                                    {getTyreShort(stint.compound)}
                                                </div>
                                                <div className={styles.stintInfo}>
                                                    <span>Stint {j + 1}: {stint.compound}</span>
                                                    <span className={styles.stintLapRange}>
                                                        Lap {stint.startLap} → {stint.endLap} ({stint.laps} laps)
                                                    </span>
                                                </div>
                                                <span className={`${styles.degradationBadge} ${styles[`deg${stint.degradation}`]}`}>
                                                    {stint.degradation} deg
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles.confidenceBar}>
                                        <span className={styles.confidenceLabel}>Confidence</span>
                                        <div className={styles.confidenceTrack}>
                                            <div
                                                className={styles.confidenceFill}
                                                style={{ width: `${strategy.confidence}%` }}
                                            />
                                        </div>
                                        <span className={styles.confidenceValue}>{strategy.confidence}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Past Results */}
                {pastResults.length > 0 && pastResults[0].Results && (
                    <section className={styles.resultsSection}>
                        <h2 className={styles.sectionTitle}><FlagIcon size={22} color="#a0d9f8" /> {new Date().getFullYear()} Race Results</h2>
                        <div className={styles.resultsTable}>
                            {pastResults[0].Results.slice(0, 10).map((result) => (
                                <div key={result.Driver.driverId} className={styles.resultRow}>
                                    <span className={`${styles.resultPos} ${parseInt(result.position) <= 3 ? styles.topPos : ''}`}>
                                        P{result.position}
                                    </span>
                                    <div
                                        className={styles.resultStripe}
                                        style={{ backgroundColor: getTeamColor(result.Constructor.constructorId) }}
                                    />
                                    <div className={styles.resultDriver}>
                                        <span>{result.Driver.givenName} <strong>{result.Driver.familyName}</strong></span>
                                        <span className={styles.resultTeam}>{result.Constructor.name}</span>
                                    </div>
                                    <span className={styles.resultTime}>
                                        {result.Time?.time || result.status}
                                    </span>
                                    <span className={styles.resultPoints}>+{result.points}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Expanded Image Modal */}
            {isImageExpanded && (
                <div className={styles.modal} onClick={() => setIsImageExpanded(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setIsImageExpanded(false)} aria-label="Close">×</button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={getCircuitImage(circuitId)}
                            alt={circuitDetail?.name}
                            className={styles.expandedImg}
                        />
                        <div className={styles.modalTitle}>{circuitDetail?.name || 'Circuit Map'}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

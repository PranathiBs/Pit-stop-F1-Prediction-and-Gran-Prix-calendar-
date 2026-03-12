'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './predictions.module.css';
import { getRaceSchedule, Race } from '@/lib/f1-api';
import { getCurrentWeather, getWeatherEmoji, WeatherData } from '@/lib/weather-api';
import { predictStrategy, mapCircuitId, CIRCUIT_DATA, getTyreColor, getTyreShort, Strategy, CircuitCharacteristics } from '@/lib/tyre-strategy';
import { getCircuitDetail } from '@/lib/circuit-data';
import { getMLPrediction, type MLResult } from '@/lib/ml-engine';

export default function PredictionsPage() {
    const [races, setRaces] = useState<Race[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState<string>('');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [trackData, setTrackData] = useState<CircuitCharacteristics | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [mlResult, setMlResult] = useState<MLResult | null>(null);
    const [mlLoading, setMlLoading] = useState(false);

    // Custom weather overrides
    const [customTemp, setCustomTemp] = useState<number>(25);
    const [customRain, setCustomRain] = useState<number>(10);
    const [useCustomWeather, setUseCustomWeather] = useState(false);

    const fetchRaces = useCallback(async () => {
        const data = await getRaceSchedule('current');
        setRaces(data);
        setInitialLoading(false);
    }, []);

    useEffect(() => {
        fetchRaces();
    }, [fetchRaces]);

    const handleCircuitSelect = async (circuitId: string) => {
        setSelectedCircuit(circuitId);
        setLoading(true);

        const race = races.find(r => r.Circuit.circuitId === circuitId);
        if (!race) { setLoading(false); return; }

        // Get weather
        const weatherData = await getCurrentWeather(
            race.Circuit.Location.lat,
            race.Circuit.Location.long
        );

        if (weatherData) {
            setWeather(weatherData);
            setCustomTemp(weatherData.temp);
            setCustomRain(weatherData.rain_probability);
        }

        // Get track data
        const mapped = mapCircuitId(circuitId);
        const track = CIRCUIT_DATA[mapped] || null;
        setTrackData(track);

        // Predict tyre strategies
        if (weatherData) {
            const effectiveWeather = useCustomWeather ? {
                ...weatherData,
                temp: customTemp,
                rain_probability: customRain,
                main: customRain > 60 ? 'Rain' : customRain > 30 ? 'Drizzle' : weatherData.main,
            } : weatherData;

            const predictions = predictStrategy(mapped, effectiveWeather);
            setStrategies(predictions);

            // Kick off ML race prediction (async, non-blocking)
            setMlLoading(true);
            setMlResult(null);
            getMLPrediction(
                new Date().getFullYear() - 1,
                race.raceName.replace(' Grand Prix', ''),
                effectiveWeather.temp,
                effectiveWeather.rain_probability,
            ).then(result => {
                setMlResult(result);
                setMlLoading(false);
            });
        }

        setLoading(false);
    };

    const recalculate = () => {
        if (!weather || !selectedCircuit) return;

        const effectiveWeather: WeatherData = useCustomWeather ? {
            ...weather,
            temp: customTemp,
            rain_probability: customRain,
            main: customRain > 60 ? 'Rain' : customRain > 30 ? 'Drizzle' : customTemp > 35 ? 'Clear' : weather.main,
        } : weather;

        const mapped = mapCircuitId(selectedCircuit);
        const predictions = predictStrategy(mapped, effectiveWeather);
        setStrategies(predictions);
    };

    const circuitDetail = selectedCircuit ? getCircuitDetail(selectedCircuit) : null;

    if (initialLoading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner} />
                <p>Loading circuits...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Tyre Strategy Predictor</h1>
                    <p className={styles.subtitle}>
                        AI-powered tyre strategy predictions based on weather conditions and track characteristics
                    </p>
                </div>

                {/* Circuit Selector */}
                <div className={styles.selectorSection}>
                    <h2 className={styles.sectionTitle}>Select Circuit</h2>
                    <div className={styles.circuitGrid}>
                        {races.map(race => {
                            const detail = getCircuitDetail(race.Circuit.circuitId);
                            const isSelected = selectedCircuit === race.Circuit.circuitId;
                            return (
                                <button
                                    key={race.Circuit.circuitId}
                                    className={`${styles.circuitBtn} ${isSelected ? styles.circuitSelected : ''}`}
                                    onClick={() => handleCircuitSelect(race.Circuit.circuitId)}
                                >
                                    <span className={styles.circuitFlag}>{detail?.flagEmoji || ''}</span>
                                    <span className={styles.circuitBtnName}>{race.Circuit.Location.locality}</span>
                                    <span className={styles.circuitCountry}>{race.Circuit.Location.country}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectedCircuit && (
                    <>
                        {/* Weather Control Panel */}
                        <div className={styles.weatherPanel}>
                            <div className={styles.weatherPanelHeader}>
                                <h2 className={styles.sectionTitle}>
                                    Weather at {circuitDetail?.name || selectedCircuit}
                                </h2>
                                <label className={styles.customToggle}>
                                    <input
                                        type="checkbox"
                                        checked={useCustomWeather}
                                        onChange={(e) => setUseCustomWeather(e.target.checked)}
                                    />
                                    <span className={styles.toggleSlider} />
                                    <span className={styles.toggleLabel}>Custom Weather</span>
                                </label>
                            </div>

                            <div className={styles.weatherContent}>
                                {weather && !useCustomWeather && (
                                    <div className={styles.liveWeather}>
                                        <div className={styles.liveWeatherMain}>
                                            <span className={styles.liveWeatherIcon}>{getWeatherEmoji(weather.main)}</span>
                                            <div>
                                                <div className={styles.liveTemp}>{weather.temp}°C</div>
                                                <div className={styles.liveDesc}>{weather.description}</div>
                                            </div>
                                        </div>
                                        <div className={styles.liveWeatherStats}>
                                            <div><span>Humidity:</span> <span>{weather.humidity}%</span></div>
                                            <div><span>Wind:</span> <span>{weather.wind_speed.toFixed(1)} m/s</span></div>
                                            <div><span>Rain:</span> <span>{weather.rain_probability}%</span></div>
                                            <div><span>Clouds:</span> <span>{weather.clouds}%</span></div>
                                        </div>
                                    </div>
                                )}

                                {useCustomWeather && (
                                    <div className={styles.customWeather}>
                                        <div className={styles.sliderGroup}>
                                            <label>
                                                <span>Temperature</span>
                                                <span className={styles.sliderValue}>{customTemp}°C</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0" max="50"
                                                value={customTemp}
                                                onChange={(e) => setCustomTemp(parseInt(e.target.value))}
                                                className={styles.slider}
                                            />
                                            <div className={styles.sliderMarks}>
                                                <span>0°C</span><span>25°C</span><span>50°C</span>
                                            </div>
                                        </div>
                                        <div className={styles.sliderGroup}>
                                            <label>
                                                <span>Rain Probability</span>
                                                <span className={styles.sliderValue}>{customRain}%</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0" max="100"
                                                value={customRain}
                                                onChange={(e) => setCustomRain(parseInt(e.target.value))}
                                                className={styles.slider}
                                            />
                                            <div className={styles.sliderMarks}>
                                                <span>Dry</span><span>Mixed</span><span>Wet</span>
                                            </div>
                                        </div>
                                        <button className={styles.recalcBtn} onClick={recalculate}>
                                            🏎️ Recalculate Strategy
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Track Info */}
                        {trackData && (
                            <div className={styles.trackInfo}>
                                <h2 className={styles.sectionTitle}>Track Characteristics</h2>
                                <div className={styles.trackGrid}>
                                    <div className={styles.trackStat}>
                                        <span className={styles.trackStatLabel}>Total Laps</span>
                                        <span className={styles.trackStatValue}>{trackData.totalLaps}</span>
                                    </div>
                                    <div className={styles.trackStat}>
                                        <span className={styles.trackStatLabel}>Tyre Degradation</span>
                                        <span className={`${styles.trackStatValue} ${styles[`deg${trackData.tyreDegradation}`]}`}>
                                            {trackData.tyreDegradation.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className={styles.trackStat}>
                                        <span className={styles.trackStatLabel}>Pit Loss</span>
                                        <span className={styles.trackStatValue}>{trackData.pitLossSeconds}s</span>
                                    </div>
                                    <div className={styles.trackStat}>
                                        <span className={styles.trackStatLabel}>Overtaking</span>
                                        <span className={styles.trackStatValue}>{trackData.overtakingDifficulty}</span>
                                    </div>
                                    <div className={styles.trackStat}>
                                        <span className={styles.trackStatLabel}>Soft Life</span>
                                        <span className={styles.trackStatValue} style={{ color: '#FF3333' }}>{trackData.softLifeLaps}L</span>
                                    </div>
                                    <div className={styles.trackStat}>
                                        <span className={styles.trackStatLabel}>Medium Life</span>
                                        <span className={styles.trackStatValue} style={{ color: '#FFC906' }}>{trackData.mediumLifeLaps}L</span>
                                    </div>
                                    <div className={styles.trackStat}>
                                        <span className={styles.trackStatLabel}>Hard Life</span>
                                        <span className={styles.trackStatValue} style={{ color: '#FFFFFF' }}>{trackData.hardLifeLaps}L</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── ML Race Prediction Grid ─────────────────── */}
                        <div className={styles.mlSection}>
                            <div className={styles.mlHeader}>
                                <span className={styles.mlTitle}>ML Race Prediction</span>
                                <span className={styles.mlBadge}>{mlResult?.version ?? 'rf_v2'}</span>
                                {mlResult?.from_cache && <span className={styles.cacheTag}>cached</span>}
                            </div>
                            {mlLoading && (
                                <div className={styles.mlLoading}>
                                    <div className={styles.spinner} />
                                    <p>RandomForest engine computing grid…</p>
                                </div>
                            )}
                            {mlResult?.error && (
                                <div className={styles.mlOffline}>
                                    ML engine offline — start the Python backend to enable predictions.<br />
                                    <code>python main.py</code>
                                </div>
                            )}
                            {!mlLoading && mlResult && !mlResult.error && mlResult.predictions.length > 0 && (
                                <div className={styles.mlGrid}>
                                    {mlResult.predictions.slice(0, 10).map((p, i) => (
                                        <div key={p.driver} className={`${styles.mlRow} ${i === 0 ? styles.mlWinner : ''}`}>
                                            <span className={styles.mlPos}>{i === 0 ? 'P1' : i === 1 ? 'P2' : i === 2 ? 'P3' : `P${p.predicted_pos}`}</span>
                                            <span className={styles.mlDriver}>{p.driver}</span>
                                            <div className={styles.mlConfBar}>
                                                <div className={styles.mlConfFill} style={{ width: `${p.confidence}%`, background: p.confidence >= 70 ? '#00e676' : p.confidence >= 50 ? '#FFD700' : '#ff9800' }} />
                                            </div>
                                            <span className={styles.mlConf}>{p.confidence.toFixed(0)}%</span>
                                            <span className={styles.mlPace}>{p.base_pace.toFixed(3)}s</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Strategy Results */}
                        {loading ? (
                            <div className={styles.loadingStrategies}>
                                <div className={styles.spinner} />
                                <p>Computing optimal strategies...</p>
                            </div>
                        ) : strategies.length > 0 ? (
                            <div className={styles.strategySection}>
                                <h2 className={styles.sectionTitle}>Predicted Strategies</h2>
                                <div className={styles.strategyGrid}>
                                    {strategies.map((strategy, i) => (
                                        <div
                                            key={i}
                                            className={`${styles.strategyCard} ${strategy.recommended ? styles.recommended : ''}`}
                                        >
                                            {strategy.recommended && (
                                                <div className={styles.recommendedTag}>RECOMMENDED</div>
                                            )}
                                            <div className={styles.strategyTop}>
                                                <h3 className={styles.stratName}>{strategy.name}</h3>
                                                <div className={styles.badges}>
                                                    <span className={`${styles.risk} ${styles[`risk${strategy.riskLevel}`]}`}>
                                                        {strategy.riskLevel}
                                                    </span>
                                                    <span className={styles.stops}>
                                                        {strategy.totalStops}S
                                                    </span>
                                                </div>
                                            </div>
                                            <p className={styles.stratDesc}>{strategy.description}</p>

                                            {/* Visual Timeline */}
                                            <div className={styles.timeline}>
                                                {strategy.stints.map((stint, j) => {
                                                    const total = strategy.stints.reduce((s, st) => s + st.laps, 0);
                                                    const width = (stint.laps / total) * 100;
                                                    return (
                                                        <div
                                                            key={j}
                                                            className={styles.timelineBar}
                                                            style={{
                                                                width: `${width}%`,
                                                                backgroundColor: getTyreColor(stint.compound),
                                                            }}
                                                        >
                                                            <span>{getTyreShort(stint.compound)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Lap Legend */}
                                            <div className={styles.stintList}>
                                                {strategy.stints.map((stint, j) => (
                                                    <div key={j} className={styles.stintItem}>
                                                        <div
                                                            className={styles.stintDot}
                                                            style={{ background: getTyreColor(stint.compound) }}
                                                        />
                                                        <span className={styles.stintCompName}>{stint.compound}</span>
                                                        <span className={styles.stintLapInfo}>
                                                            L{stint.startLap}–L{stint.endLap} ({stint.laps} laps)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Confidence */}
                                            <div className={styles.confidence}>
                                                <div className={styles.confBar}>
                                                    <div
                                                        className={styles.confFill}
                                                        style={{ width: `${strategy.confidence}%` }}
                                                    />
                                                </div>
                                                <span className={styles.confText}>{strategy.confidence}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Tyre Compound Legend */}
                        <div className={styles.legend}>
                            <h3 className={styles.legendTitle}>Tyre Compounds</h3>
                            <div className={styles.legendItems}>
                                {[
                                    { name: 'Soft', color: '#FF3333', abbr: 'S' },
                                    { name: 'Medium', color: '#FFC906', abbr: 'M' },
                                    { name: 'Hard', color: '#FFFFFF', abbr: 'H' },
                                    { name: 'Intermediate', color: '#39B54A', abbr: 'I' },
                                    { name: 'Wet', color: '#0072C6', abbr: 'W' },
                                ].map(tyre => (
                                    <div key={tyre.name} className={styles.legendItem}>
                                        <div className={styles.legendCircle} style={{ borderColor: tyre.color, color: tyre.color }}>
                                            {tyre.abbr}
                                        </div>
                                        <span>{tyre.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

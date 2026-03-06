'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Zap, Wind, Droplets, Thermometer, Info, Beaker, Play,
    AlertTriangle, Trophy, Cloud, Sun, CloudRain, Flag as FlagIcon,
    MapPin, Gauge, BarChart3, Award
} from 'lucide-react';
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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.header}
                >
                    <h1 className={styles.title}>Tyre Strategy Predictor</h1>
                    <p className={styles.subtitle}>
                        AI-powered tyre strategy predictions based on weather conditions and track characteristics
                    </p>
                </motion.div>

                {/* Circuit Selector */}
                <div className={styles.selectorSection}>
                    <h2 className={styles.sectionTitle}>Select Circuit</h2>
                    <motion.div
                        className={styles.circuitGrid}
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.03 }
                            }
                        }}
                    >
                        {races.map(race => {
                            const detail = getCircuitDetail(race.Circuit.circuitId);
                            const isSelected = selectedCircuit === race.Circuit.circuitId;
                            return (
                                <motion.button
                                    key={race.Circuit.circuitId}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.9 },
                                        visible: { opacity: 1, scale: 1 }
                                    }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`${styles.circuitBtn} ${isSelected ? styles.circuitSelected : ''}`}
                                    onClick={() => handleCircuitSelect(race.Circuit.circuitId)}
                                >
                                    <FlagIcon size={16} color={detail?.color || '#E10600'} style={{ marginRight: 8 }} />
                                    <span className={styles.circuitBtnName}>{race.Circuit.Location.locality}</span>
                                    <span className={styles.circuitCountry}>{race.Circuit.Location.country}</span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </div>

                {selectedCircuit && (
                    <>
                        {/* Weather Control Panel */}
                        <div className={styles.weatherPanel}>
                            <div className={styles.weatherPanelHeader}>
                                <h2 className={styles.sectionTitle}>
                                    <CloudRain size={20} color="#E10600" style={{ marginRight: 8 }} />
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
                                            <div><Droplets size={14} color="rgba(255,255,255,0.4)" /> <span>Humidity:</span> <span>{weather.humidity}%</span></div>
                                            <div><Wind size={14} color="rgba(255,255,255,0.4)" /> <span>Wind:</span> <span>{weather.wind_speed.toFixed(1)} m/s</span></div>
                                            <div><CloudRain size={14} color="rgba(255,255,255,0.4)" /> <span>Rain:</span> <span>{weather.rain_probability}%</span></div>
                                            <div><Cloud size={14} color="rgba(255,255,255,0.4)" /> <span>Clouds:</span> <span>{weather.clouds}%</span></div>
                                        </div>
                                    </div>
                                )}

                                {useCustomWeather && (
                                    <div className={styles.customWeather}>
                                        <div className={styles.sliderGroup}>
                                            <label>
                                                <Thermometer size={16} color="rgba(255,255,255,0.4)" /> <span>Temperature</span>
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
                                                <CloudRain size={16} color="rgba(255,255,255,0.4)" /> <span>Rain Probability</span>
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
                                            <Zap size={18} /> Recalculate Strategy
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Track Info */}
                        {trackData && (
                            <div className={styles.trackInfo}>
                                <h2 className={styles.sectionTitle}><BarChart3 size={20} color="#E10600" style={{ marginRight: 8 }} /> Track Characteristics</h2>
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
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`${styles.mlSection} glass-card`}
                        >
                            <div className={styles.mlHeader}>
                                <Beaker className={styles.mlIcon} size={18} color="#FFD700" />
                                <span className={styles.mlTitle}>ML Race Prediction</span>
                                <span className={styles.mlBadge}>{mlResult?.version ?? 'rf_v2'}</span>
                                {mlResult?.from_cache && <span className={styles.cacheTag}>cached</span>}
                            </div>

                            <AnimatePresence mode="wait">
                                {mlLoading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={styles.mlLoading}
                                    >
                                        <div className={styles.spinner} />
                                        <p className="text-mono">RandomForest engine computing grid…</p>
                                    </motion.div>
                                ) : mlResult?.error ? (
                                    <motion.div
                                        key="error"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={styles.mlOffline}
                                    >
                                        <AlertTriangle size={18} />
                                        <span>
                                            ML engine starting up or offline. Run <code>npm run dev</code> to enable.
                                        </span>
                                    </motion.div>
                                ) : mlResult && mlResult.predictions.length > 0 ? (
                                    <motion.div
                                        key="grid"
                                        initial="hidden"
                                        animate="visible"
                                        variants={{
                                            hidden: { opacity: 0 },
                                            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                                        }}
                                        className={styles.mlGrid}
                                    >
                                        {mlResult.predictions.slice(0, 10).map((p, i) => (
                                            <motion.div
                                                key={p.driver}
                                                variants={{
                                                    hidden: { opacity: 0, x: -10 },
                                                    visible: { opacity: 1, x: 0 }
                                                }}
                                                className={`${styles.mlRow} ${i === 0 ? styles.mlWinner : ''}`}
                                            >
                                                <span className={styles.mlPos}>
                                                    {i === 0 ? <Trophy size={14} color="#FFD700" /> : i === 1 ? <Award size={14} color="#C0C0C0" /> : i === 2 ? <Award size={14} color="#CD7F32" /> : `P${i + 1}`}
                                                </span>
                                                <span className={`${styles.mlDriver} text-mono`}>{p.driver}</span>
                                                <div className={styles.mlConfBar}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${p.confidence}%` }}
                                                        className={styles.mlConfFill}
                                                        style={{ background: p.confidence >= 70 ? '#00e676' : p.confidence >= 50 ? '#FFD700' : '#ff9800' }}
                                                    />
                                                </div>
                                                <span className={`${styles.mlConf} text-mono`}>{p.confidence.toFixed(0)}%</span>
                                                <span className={styles.mlPace}>{p.base_pace.toFixed(3)}s</span>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </motion.div>

                        {/* Strategy Results */}
                        {loading ? (
                            <div className={styles.loadingStrategies}>
                                <div className={styles.spinner} />
                                <p>Computing optimal strategies...</p>
                            </div>
                        ) : strategies.length > 0 ? (
                            <div className={styles.strategySection}>
                                <h2 className={styles.sectionTitle}>🎯 Predicted Strategies</h2>
                                <motion.div
                                    className={styles.strategyGrid}
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                                    }}
                                >
                                    {strategies.map((strategy, i) => (
                                        <motion.div
                                            key={i}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: { opacity: 1, y: 0 }
                                            }}
                                            className={`${styles.strategyCard} ${strategy.recommended ? styles.recommended : ''} glass-card`}
                                        >
                                            {strategy.recommended && (
                                                <div className={styles.recommendedTag}>
                                                    <Trophy size={10} style={{ marginRight: 4 }} />
                                                    RECOMMENDED
                                                </div>
                                            )}
                                            <div className={styles.strategyTop}>
                                                <h3 className={styles.stratName}>{strategy.name}</h3>
                                                <div className={styles.badges}>
                                                    <span className={`${styles.risk} ${styles[`risk${strategy.riskLevel}`]}`}>
                                                        {strategy.riskLevel}
                                                    </span>
                                                    <span className={styles.stops}>
                                                        {strategy.totalStops} STOPS
                                                    </span>
                                                </div>
                                            </div>
                                            <p className={styles.stratDesc}>{strategy.description}</p>

                                            {/* Visual Timeline (Visual Stint Pills) */}
                                            <div className={styles.timeline}>
                                                {strategy.stints.map((stint, j) => {
                                                    const total = strategy.stints.reduce((s, st) => s + st.laps, 0);
                                                    const width = (stint.laps / total) * 100;
                                                    return (
                                                        <motion.div
                                                            key={j}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${width}%` }}
                                                            transition={{ delay: 0.2 + (j * 0.1), duration: 0.5 }}
                                                            className={styles.timelineBar}
                                                            style={{
                                                                backgroundColor: getTyreColor(stint.compound),
                                                                boxShadow: `0 0 15px ${getTyreColor(stint.compound)}44`
                                                            }}
                                                        >
                                                            <span>{getTyreShort(stint.compound)}</span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            {/* Lap Legend */}
                                            <div className={styles.stintList}>
                                                {strategy.stints.map((stint, j) => (
                                                    <div key={j} className={styles.stintItem}>
                                                        <div
                                                            className={styles.stintDot}
                                                            style={{
                                                                background: getTyreColor(stint.compound),
                                                                boxShadow: `0 0 8px ${getTyreColor(stint.compound)}`
                                                            }}
                                                        />
                                                        <span className={styles.stintCompName}>{stint.compound}</span>
                                                        <span className={`${styles.stintLapInfo} text-mono`}>
                                                            L{stint.startLap}–L{stint.endLap} ({stint.laps} laps)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Confidence */}
                                            <div className={styles.confidence}>
                                                <div className={styles.confBar}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${strategy.confidence}%` }}
                                                        className={styles.confFill}
                                                    />
                                                </div>
                                                <span className={`${styles.confText} text-mono`}>{strategy.confidence}%</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
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

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { Race, DriverStanding, ConstructorStanding, getRaceSchedule, getDriverStandings, getConstructorStandings, getLastRaceResults } from '@/lib/f1-api';
import { getCurrentWeather, getWeatherEmoji, WeatherData } from '@/lib/weather-api';
import { getTeamColor } from '@/lib/team-colors';
import { getCategoryDetails, F1NewsItem, getRefreshInterval } from '@/lib/f1-news';
import DriverComparison from '@/components/DriverComparison';
import SpeedTracker from '@/components/SpeedTracker';
import {
  Wind, Droplets, Thermometer, Cloud, Sun, CloudRain, CloudLightning,
  MapPin, Clock, Timer, Flag, History, BarChart3, ChevronRight, PlayCircle,
  Zap, Calendar, Trophy, Gauge, Activity, Info, Newspaper, Shield, Award,
  Database, Cpu, Radio, RefreshCw
} from 'lucide-react';
import F1Car from '@/components/F1Car';

export default function Dashboard() {
  const [schedule, setSchedule] = useState<Race[]>([]);
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [lastRace, setLastRace] = useState<Race | null>(null);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [nextRaceWeather, setNextRaceWeather] = useState<WeatherData | null>(null);
  const [newsItems, setNewsItems] = useState<F1NewsItem[]>([]);
  const [newsLastUpdated, setNewsLastUpdated] = useState<string>('');
  const [showAllNews, setShowAllNews] = useState(false);
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set());
  const [newsFilter, setNewsFilter] = useState<string>('all');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [scheduleData, driversData, constructorsData, lastRaceData, newsResponse] = await Promise.all([
        getRaceSchedule('current'),
        getDriverStandings('current'),
        getConstructorStandings('current'),
        getLastRaceResults(),
        fetch('/api/news').then(res => res.json()).catch(() => ({ items: [] })),
      ]);

      setSchedule(scheduleData);
      setDriverStandings(driversData);
      setConstructorStandings(constructorsData);
      setLastRace(lastRaceData);
      setNewsItems(newsResponse?.items || []);
      setNewsLastUpdated(newsResponse?.lastUpdated || '');

      const now = new Date();
      const upcoming = scheduleData.find((race: Race) => new Date(race.date) > now);
      if (upcoming) {
        setNextRace(upcoming);
        const weather = await getCurrentWeather(
          upcoming.Circuit.Location.lat,
          upcoming.Circuit.Location.long
        );
        setNextRaceWeather(weather);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch initial data and setup auto-refresh
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Smart Polling
  useEffect(() => {
    const intervalTime = getRefreshInterval(nextRace?.date);
    console.log(`[Dashboard] Polling active. Interval: ${intervalTime / 1000}s`);

    const interval = setInterval(() => {
      fetchData(true);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [fetchData, nextRace?.date]);

  // Countdown
  useEffect(() => {
    if (!nextRace) return;
    const updateCountdown = () => {
      const raceDate = new Date(`${nextRace.date}T${nextRace.time || '14:00:00Z'}`);
      const diff = raceDate.getTime() - Date.now();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextRace]);

  const toggleNewsExpand = (id: string) => {
    setExpandedNews(prev => {
      const next = new Set<string>(); // Single expansion for cleaner look
      if (!prev.has(id)) next.add(id);
      return next;
    });
  };

  const filteredNews = newsFilter === 'all'
    ? newsItems
    : newsItems.filter(n => n.category === newsFilter);

  const displayedNews = showAllNews ? filteredNews : filteredNews.slice(0, 6);

  // Scroll pop-up observer for news cards
  const newsGridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.newsCardVisible);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    const cards = newsGridRef.current?.querySelectorAll(`.${styles.newsCard}`);
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [displayedNews]);



  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingCar}>
            <F1Car size={60} />
          </div>
          <div className={styles.loadingBar}>
            <div className={styles.loadingProgress} />
          </div>
          <p className={styles.loadingText}>LOADING PIT STOP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroMain}>
            {/* Left — Race info */}
            <div className={styles.heroLeft}>
              <span className={styles.heroBadge}>
                <Activity size={14} /> NEXT RACE
              </span>
              <h1 className={styles.heroTitle}>
                {nextRace?.raceName || 'Loading...'}
              </h1>
              <p className={styles.heroSubtitle}>
                <MapPin size={14} color="rgba(255,255,255,0.6)" />
                {nextRace?.Circuit.circuitName} • {nextRace?.Circuit.Location.locality}, {nextRace?.Circuit.Location.country}
              </p>
              <p className={styles.heroDate}>
                <Calendar size={14} color="rgba(255,255,255,0.5)" />
                {nextRace ? new Date(nextRace.date).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                }) : ''}
              </p>

              <div className={styles.countdown}>
                {[
                  { val: countdown.days, label: 'DAYS' },
                  { val: countdown.hours, label: 'HRS' },
                  { val: countdown.minutes, label: 'MIN' },
                  { val: countdown.seconds, label: 'SEC' },
                ].map((item, i) => (
                  <React.Fragment key={item.label}>
                    {i > 0 && <span className={styles.countdownSep}>:</span>}
                    <div className={styles.countdownItem}>
                      <span className={styles.countdownNumber}>{String(item.val).padStart(2, '0')}</span>
                      <span className={styles.countdownLabel}>{item.label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className={styles.heroActions}>
                <Link href={`/circuit/${nextRace?.Circuit.circuitId || ''}`} className={styles.heroButton}>
                  <MapPin size={16} color="white" /> View Circuit Details
                </Link>
                <Link href="/predictions" className={styles.heroButtonOutline}>
                  <Zap size={16} color="#E10600" /> Predict Strategy
                </Link>
              </div>
            </div>

            {/* Right — Weather + Schedule panel */}
            <div className={styles.heroRight}>
              {nextRaceWeather && (
                <div className={styles.weatherWidget}>
                  <div className={styles.weatherWidgetHeader}>
                    <Cloud size={14} color="rgba(255,255,255,0.5)" />
                    <span>WEATHER</span>
                  </div>
                  <div className={styles.weatherHeader}>
                    <span className={styles.weatherIcon}>{getWeatherEmoji(nextRaceWeather.main)}</span>
                    <div>
                      <div className={styles.weatherTemp}>{nextRaceWeather.temp}°C</div>
                      <div className={styles.weatherDesc}>{nextRaceWeather.description}</div>
                    </div>
                  </div>
                  <div className={styles.weatherDetails}>
                    <div className={styles.weatherDetail}><Droplets size={11} color="#2293D1" /><span>Humidity</span><span>{nextRaceWeather.humidity}%</span></div>
                    <div className={styles.weatherDetail}><Wind size={11} color="#A0A0A0" /><span>Wind</span><span>{nextRaceWeather.wind_speed.toFixed(1)} m/s</span></div>
                    <div className={styles.weatherDetail}><CloudRain size={11} color="#2293D1" /><span>Rain</span><span>{nextRaceWeather.rain_probability}%</span></div>
                    <div className={styles.weatherDetail}><Cloud size={11} color="#A0A0A0" /><span>Clouds</span><span>{nextRaceWeather.clouds}%</span></div>
                  </div>
                </div>
              )}

              {nextRace && (
                <div className={styles.scheduleWidget}>
                  <div className={styles.scheduleWidgetHeader}>
                    <Clock size={14} color="rgba(255,255,255,0.4)" />
                    <span>SCHEDULE</span>
                  </div>
                  {nextRace.FirstPractice && (
                    <div className={styles.scheduleItem}>
                      <span className={styles.scheduleSession}>FP1</span>
                      <span className={styles.scheduleDate}>{new Date(nextRace.FirstPractice.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className={styles.scheduleTime}>{nextRace.FirstPractice.time?.substring(0, 5) || 'TBC'}</span>
                    </div>
                  )}
                  {nextRace.Qualifying && (
                    <div className={styles.scheduleItem}>
                      <span className={`${styles.scheduleSession} ${styles.sessionQuali}`}>QUALI</span>
                      <span className={styles.scheduleDate}>{new Date(nextRace.Qualifying.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className={styles.scheduleTime}>{nextRace.Qualifying.time?.substring(0, 5) || 'TBC'}</span>
                    </div>
                  )}
                  {nextRace.Sprint && (
                    <div className={styles.scheduleItem}>
                      <span className={`${styles.scheduleSession} ${styles.sessionSprint}`}>SPRINT</span>
                      <span className={styles.scheduleDate}>{new Date(nextRace.Sprint.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className={styles.scheduleTime}>{nextRace.Sprint.time?.substring(0, 5) || 'TBC'}</span>
                    </div>
                  )}
                  <div className={styles.scheduleItem}>
                    <span className={`${styles.scheduleSession} ${styles.sessionRace}`}>RACE</span>
                    <span className={styles.scheduleDate}>{new Date(nextRace.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className={styles.scheduleTime}>{nextRace.time?.substring(0, 5) || 'TBC'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Red Gradient Stats bar — Clickable */}
      <Link href="/calendar" className={styles.heroStatsStrip}>
        <div className={styles.heroStatItem}>
          <div className={styles.heroStatValue}>{schedule.length}</div>
          <div className={styles.heroStatLabel}>total races</div>
        </div>
        <div className={styles.heroStatItem}>
          <div className={styles.heroStatValue}>{schedule.filter(r => new Date(r.date) < new Date()).length}</div>
          <div className={styles.heroStatLabel}>completed</div>
        </div>
        <div className={styles.heroStatItem}>
          <div className={styles.heroStatValue}>{nextRaceWeather ? `${nextRaceWeather.temp}°` : '--'}</div>
          <div className={styles.heroStatLabel}>track temp</div>
        </div>
        <div className={styles.heroStatItem}>
          <div className={styles.heroStatValue}>{nextRaceWeather ? `${nextRaceWeather.rain_probability}%` : '--'}</div>
          <div className={styles.heroStatLabel}>rain chance</div>
        </div>
      </Link>

      <div className={styles.container}>

        {/* ===== LATEST UPDATES ===== */}
        <section className={styles.newsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Newspaper size={22} color="#E10600" />
              <span>Latest Updates</span>
              <Link href="/news" className={styles.seeAll} style={{ marginLeft: '12px', fontSize: '0.75rem' }}>See All →</Link>
            </h2>
            <div className={styles.newsControls}>
              {refreshing && <span className={styles.refreshIndicator}><div className={styles.miniSpinner} /></span>}
              <span className={styles.lastUpdated}>
                Updated {newsLastUpdated ? new Date(newsLastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '...'}
              </span>
              <span className={styles.regTag}>
                <Zap size={12} color="#FFC906" /> 2026 REGS
              </span>
            </div>
          </div>

          {/* Category Filters */}
          <div className={styles.newsFilters}>
            {['all', 'race', 'official', 'regulation', 'transfer', 'technical'].map(cat => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${newsFilter === cat ? styles.filterActive : ''}`}
                onClick={() => setNewsFilter(cat)}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Official Style Hero Grid */}
          <div className={styles.heroNewsGrid}>
            {displayedNews.length > 0 ? (
              <>
                {/* Main Featured Story */}
                <div className={styles.mainFeature}>
                  <Link href={displayedNews[0].url || '#'} target="_blank" className={styles.featureLink}>
                    <div className={styles.featureImageWrap}>
                      {displayedNews[0].imageUrl && (
                        <img
                          src={displayedNews[0].imageUrl}
                          alt={displayedNews[0].title}
                          className={styles.featureImage}
                        />
                      )}
                      <div className={styles.featureOverlay} />
                    </div>
                    <div className={styles.featureContent}>
                      <span className={styles.featureBadge}>FEATURED</span>
                      <h3 className={styles.featureTitle}>{displayedNews[0].title}</h3>
                      <p className={styles.featureSummary}>{displayedNews[0].summary}</p>
                    </div>
                  </Link>
                </div>

                {/* Side Features Column */}
                <div className={styles.sideFeatures}>
                  {displayedNews.slice(1, 3).map((item) => (
                    <Link key={item.id} href={item.url || '#'} target="_blank" className={styles.sideFeature}>
                      <div className={styles.sideImageWrap}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className={styles.sideImage}
                          />
                        )}
                        <div className={styles.sideOverlay} />
                      </div>
                      <div className={styles.sideContent}>
                        <span className={styles.sideBadge}>{getCategoryDetails(item.category).label}</span>
                        <h4 className={styles.sideTitle}>{item.title}</h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.emptyStateIcon}>
                  <Newspaper size={28} color="#E10600" />
                </div>
                <div className={styles.emptyStateTitle}>No {newsFilter !== 'all' ? newsFilter.charAt(0).toUpperCase() + newsFilter.slice(1) : ''} Updates</div>
                <div className={styles.emptyStateText}>
                  No updates found for this category. Try selecting &ldquo;All&rdquo; to see all available news.
                </div>
              </div>
            )}
          </div>

          <div className={styles.newsGrid} ref={newsGridRef}>
            {displayedNews.slice(3).map((item) => {
              const catInfo = getCategoryDetails(item.category);
              const CategoryIcon = catInfo.icon;
              const isExpanded = expandedNews.has(item.id);
              return (
                <div key={item.id} className={`${styles.newsCard} ${item.isBreaking ? styles.breakingCard : ''} ${isExpanded ? styles.newsCardExpanded : ''}`}>
                  {item.imageUrl && (
                    <Link href={item.url || '#'} target="_blank" className={styles.cardImageLink}>
                      <div className={styles.cardImageWrap}>
                        <img src={item.imageUrl} alt={item.title} className={styles.cardImage} />
                        <div className={styles.cardCategoryBadge}>{catInfo.label}</div>
                      </div>
                    </Link>
                  )}
                  {item.isBreaking && !item.imageUrl && (
                    <div className={styles.breakingBanner}>
                      <Zap size={12} color="#E10600" />
                      <span>BREAKING</span>
                    </div>
                  )}
                  <div className={styles.newsCardHeader}>
                    {!item.imageUrl && (
                      <div className={styles.categoryIconWrap} style={{ background: `linear-gradient(135deg, ${catInfo.color}33, transparent)` }}>
                        <CategoryIcon size={16} color={catInfo.color} className={styles.categoryIcon} />
                      </div>
                    )}
                    <span className={styles.newsDate}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={styles.newsSource}>{item.source}</span>
                  </div>
                  <div className={styles.newsCardBody}>
                    <Link href={item.url || '#'} target="_blank" className={styles.newsTitleLink}>
                      <h3 className={styles.newsTitle}>{item.title}</h3>
                    </Link>
                    <p className={`${styles.newsSummary} ${isExpanded ? styles.newsSummaryExpanded : ''}`}>
                      {item.summary}
                    </p>
                  </div>

                  <div className={styles.newsFooter}>
                    <Link href={item.url || '#'} target="_blank" className={styles.readMoreLink}>
                      Read Full Story →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNews.length > displayedNews.length && (
            <button
              className={styles.showAllBtn}
              onClick={() => setShowAllNews(true)}
            >
              Show All {filteredNews.length} Updates ▼
            </button>
          )}
        </section>

        {/* Two Column: Standings */}
        <div className={styles.twoCol}>
          <section className={styles.standingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Trophy size={20} color="#E10600" />
                <span>Driver Standings</span>
              </h2>
              <Link href="/standings" className={styles.seeAll}>See All →</Link>
            </div>
            {driverStandings.length > 0 ? (
              <div className={styles.standingsList}>
                {driverStandings.slice(0, 10).map((standing, index) => (
                  <div key={standing.Driver.driverId} className={styles.standingRow}>
                    <span className={`${styles.position} ${index < 3 ? styles.topPosition : ''}`}>
                      {index === 0 ? <Trophy size={16} color="#FFD700" /> :
                        index === 1 ? <Trophy size={16} color="#C0C0C0" /> :
                          index === 2 ? <Trophy size={16} color="#CD7F32" /> :
                            standing.position}
                    </span>
                    <div className={styles.teamStripe} style={{ backgroundColor: getTeamColor(standing.Constructors[0]?.constructorId || '') }} />
                    <div className={styles.driverInfo}>
                      <span className={styles.driverName}>
                        {standing.Driver.givenName} <strong>{standing.Driver.familyName}</strong>
                      </span>
                      <span className={styles.teamName}>{standing.Constructors[0]?.name}</span>
                    </div>
                    <div className={styles.driverStats}>
                      <span className={styles.points}>{standing.points} PTS</span>
                      <span className={styles.wins}>{standing.wins} wins</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <Flag size={28} color="#E10600" />
                </div>
                <div className={styles.emptyStateTitle}>Season Not Started</div>
                <div className={styles.emptyStateText}>Championships standings will appear here after the first race of the 2026 season.</div>
              </div>
            )}
          </section>

          <section className={styles.standingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Shield size={20} color="#E10600" />
                <span>Constructors</span>
              </h2>
              <Link href="/standings" className={styles.seeAll}>See All →</Link>
            </div>
            {constructorStandings.length > 0 ? (
              <div className={styles.standingsList}>
                {constructorStandings.slice(0, 10).map((standing, index) => (
                  <div key={standing.Constructor.constructorId} className={styles.standingRow}>
                    <span className={`${styles.position} ${index < 3 ? styles.topPosition : ''}`}>
                      {index === 0 ? <Trophy size={16} color="#FFD700" /> :
                        index === 1 ? <Trophy size={16} color="#C0C0C0" /> :
                          index === 2 ? <Trophy size={16} color="#CD7F32" /> :
                            standing.position}
                    </span>
                    <div className={styles.teamStripe} style={{ backgroundColor: getTeamColor(standing.Constructor.constructorId) }} />
                    <div className={styles.driverInfo}>
                      <span className={styles.driverName}><strong>{standing.Constructor.name}</strong></span>
                      <span className={styles.teamName}>{standing.Constructor.nationality}</span>
                    </div>
                    <div className={styles.driverStats}>
                      <span className={styles.points}>{standing.points} PTS</span>
                      <span className={styles.wins}>{standing.wins} wins</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <Shield size={28} color="#E10600" />
                </div>
                <div className={styles.emptyStateTitle}>Awaiting First Race</div>
                <div className={styles.emptyStateText}>Constructor standings will be updated once the 2026 season gets underway.</div>
              </div>
            )}
          </section>
        </div>

        {/* New Features Row: Head-to-Head + Speed Tracker */}
        <div className={styles.twoCol}>
          <DriverComparison />
          <SpeedTracker />
        </div>

        {/* Last Race */}
        {lastRace && lastRace.Results && (
          <section className={styles.lastRace}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Flag size={20} color="#E10600" />
                <span>Last Race Result</span>
              </h2>
              <span className={styles.lastRaceName}>{lastRace.raceName}</span>
            </div>
            <div className={styles.podium}>
              {lastRace.Results.slice(0, 3).map((result, i) => (
                <div key={result.Driver.driverId} className={`${styles.podiumItem} ${styles[`podium${i + 1}`]}`}>
                  <div className={styles.podiumMedal}>
                    <Award size={32} color={i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32'} />
                  </div>
                  <div className={styles.podiumDriver}>{result.Driver.givenName} {result.Driver.familyName}</div>
                  <div className={styles.podiumTeam}>{result.Constructor.name}</div>
                  <div className={styles.podiumTime}>{result.Time?.time || result.status}</div>
                </div>
              ))}
            </div>
            <div className={styles.lastRaceGrid}>
              {lastRace.Results.slice(3, 10).map((result) => (
                <div key={result.Driver.driverId} className={styles.resultRow}>
                  <span className={styles.resultPos}>P{result.position}</span>
                  <div className={styles.teamStripe} style={{ backgroundColor: getTeamColor(result.Constructor.constructorId) }} />
                  <span className={styles.resultDriver}>{result.Driver.code}</span>
                  <span className={styles.resultPoints}>+{result.points} pts</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== ML FLOW — PREDICTION ENGINE ===== */}
        <section className={styles.mlFlowSection}>
          <div className={styles.mlFlowHeader}>
            <span className={styles.mlFlowSubtitle}>
              <Cpu size={14} /> RECURRENT NEURAL SIMULATION
            </span>
            <h2 className={styles.mlFlowTitle}>How Pit Stop Predicts</h2>
            <p className={styles.mlFlowDesc}>
              Our model doesn&apos;t predict once — it re-calculates win probability every timing sector, treating each race as a dynamic feedback loop.
            </p>
          </div>

          <div className={styles.mlFlowGrid}>
            {/* Node 1: Dynamic Feature Store */}
            <div className={styles.mlFlowNode}>
              <div className={styles.mlNodeIcon}>
                <Database size={26} color="#E10600" />
              </div>
              <div className={styles.mlNodeTitle}>Dynamic Feature Store</div>
              <div className={styles.mlNodeDesc}>
                Aggregates live telemetry — tyre degradation, fuel load, track temp — with static circuit data.
              </div>
              <div className={styles.mlNodeIndicator}>
                <span className={styles.mlNodeIndicatorDot} />
                LIVE FEED
              </div>
            </div>

            {/* Connector */}
            <div className={styles.mlFlowConnector}>
              <div className={styles.mlConnectorLine} />
            </div>

            {/* Node 2: Stochastic Engine */}
            <div className={styles.mlFlowNode}>
              <div className={styles.mlNodeIcon}>
                <Zap size={26} color="#E10600" />
              </div>
              <div className={styles.mlNodeTitle}>Stochastic Engine</div>
              <div className={styles.mlNodeDesc}>
                Monte Carlo simulations predict chaos variables — Safety Cars, rain probability, VSC windows.
              </div>
              <div className={styles.mlNodeIndicator}>
                <span className={styles.mlNodeIndicatorDot} />
                10K SIMS/SEC
              </div>
            </div>

            {/* Connector */}
            <div className={styles.mlFlowConnector}>
              <div className={styles.mlConnectorLine} />
            </div>

            {/* Node 3: Real-time Inference */}
            <div className={styles.mlFlowNode}>
              <div className={styles.mlNodeIcon}>
                <Radio size={26} color="#E10600" />
              </div>
              <div className={styles.mlNodeTitle}>Real-time Inference</div>
              <div className={styles.mlNodeDesc}>
                Updates win probability at every timing sector — not once per race, but every single lap.
              </div>
              <div className={styles.mlNodeIndicator}>
                <span className={styles.mlNodeIndicatorDot} />
                PER SECTOR
              </div>
            </div>
          </div>

          {/* Feedback Loop */}
          <div className={styles.mlFlowFeedback}>
            <RefreshCw size={14} className={styles.mlFeedbackArrow} />
            <span className={styles.mlFeedbackText}>OUTPUT → FEEDS BACK AS INPUT → NEXT LAP PREDICTION</span>
            <RefreshCw size={14} className={styles.mlFeedbackArrow} />
          </div>
        </section>

        {/* Quick Links */}
        <section className={styles.quickLinks}>
          <Link href="/calendar" className={styles.quickLink}>
            <div className={styles.quickLinkIconWrap}><Calendar size={28} color="#E10600" /></div>
            <span className={styles.quickLinkTitle}>Race Calendar</span>
            <span className={styles.quickLinkDesc}>Full 2026 season schedule</span>
          </Link>
          <Link href="/predictions" className={styles.quickLink}>
            <div className={styles.quickLinkIconWrap}><Zap size={28} color="#E10600" /></div>
            <span className={styles.quickLinkTitle}>Tyre Strategy</span>
            <span className={styles.quickLinkDesc}>Weather-based pit predictions</span>
          </Link>
          <Link href="/standings" className={styles.quickLink}>
            <div className={styles.quickLinkIconWrap}><Trophy size={28} color="#E10600" /></div>
            <span className={styles.quickLinkTitle}>Championships</span>
            <span className={styles.quickLinkDesc}>Driver & Constructor standings</span>
          </Link>
          <Link href="/records" className={styles.quickLink}>
            <div className={styles.quickLinkIconWrap}><BarChart3 size={28} color="#E10600" /></div>
            <span className={styles.quickLinkTitle}>Records</span>
            <span className={styles.quickLinkDesc}>Historical F1 data & stats</span>
          </Link>
        </section>
      </div>
    </div>
  );
}

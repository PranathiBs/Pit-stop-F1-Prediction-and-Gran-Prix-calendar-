'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { Race, DriverStanding, ConstructorStanding, getRaceSchedule, getDriverStandings, getConstructorStandings, getLastRaceResults } from '@/lib/f1-api';
import { getCurrentWeather, getWeatherEmoji, WeatherData } from '@/lib/weather-api';
import { getTeamColor } from '@/lib/team-colors';
import { getLatestUpdates, getCategoryDetails, F1NewsItem, getRefreshInterval } from '@/lib/f1-news';
import DriverComparison from '@/components/DriverComparison';
import SpeedTracker from '@/components/SpeedTracker';
import { HoverButton } from '@/components/ui/hover-button';
import {
  TrophyIcon, HelmetIcon, ConstructorIcon, FlagIcon,
  SpeedometerIcon, WeatherIcon, CalendarIcon, RacingCarIcon,
  StatsIcon, TyreIcon, CircuitIcon, BoltIcon, ClockIcon,
  MedalIcon, LiveIcon, NewsIcon, GavelIcon, TransferIcon,
  TechnicalIcon, FlashIcon, OfficialIcon
} from '@/components/Icons';
import { Flag, CheckCircle, Clock as LucideClock } from 'lucide-react';
import { motion } from 'framer-motion';

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
        getLatestUpdates(),
      ]);

      setSchedule(scheduleData);
      setDriverStandings(driversData);
      setConstructorStandings(constructorsData);
      setLastRace(lastRaceData);
      setNewsItems(newsResponse.items);
      setNewsLastUpdated(newsResponse.lastUpdated);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh news
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, getRefreshInterval());
    return () => clearInterval(interval);
  }, [fetchData]);

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
            <RacingCarIcon size={48} color="#a0d9f8" />
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
        <div className={styles.heroBackground}>
          <div className={styles.heroGrid} />
          <div className={styles.heroGlow} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <span className={styles.heroBadge}>
              <LiveIcon size={14} /> NEXT RACE
            </span>
            <h1 className={styles.heroTitle}>
              {nextRace?.raceName || 'Loading...'}
            </h1>
            <p className={styles.heroSubtitle}>
              <CircuitIcon size={14} color="rgba(255,255,255,0.5)" />
              {nextRace?.Circuit.circuitName} • {nextRace?.Circuit.Location.locality}, {nextRace?.Circuit.Location.country}
            </p>
            <p className={styles.heroDate}>
              <CalendarIcon size={14} color="rgba(255,255,255,0.4)" />
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
                  {i > 0 && <span className={styles.countdownSep} style={{ color: 'rgba(160, 217, 248, 0.2)' }}>:</span>}
                  <div className={styles.countdownItem}>
                    <span className={styles.countdownNumber}>{String(item.val).padStart(2, '0')}</span>
                    <span className={styles.countdownLabel}>{item.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className={styles.heroActions}>
              <Link href={`/circuit/${nextRace?.Circuit.circuitId || ''}`}>
                <HoverButton className="bg-transparent border-white/20 shadow-[0_0_20px_rgba(160,217,248,0.2)]">
                  <CircuitIcon size={20} color="#a0d9f8" />
                  <span className="uppercase font-bold tracking-[2px] text-sm">View Circuit</span>
                </HoverButton>
              </Link>
              <Link href="/predictions">
                <HoverButton className="bg-transparent border-white/20 shadow-[0_0_20px_rgba(160,217,248,0.2)]">
                  <TyreIcon size={20} color="#a0d9f8" />
                  <span className="uppercase font-bold tracking-[2px] text-sm">Predict Strategy</span>
                </HoverButton>
              </Link>
            </div>
          </div>

          <div className={styles.heroRight}>
            {nextRaceWeather && (
              <div className={styles.weatherWidget}>
                <div className={styles.weatherWidgetHeader}>
                  <WeatherIcon size={16} color="rgba(255,255,255,0.5)" />
                  <span>CIRCUIT WEATHER</span>
                </div>
                <div className={styles.weatherHeader}>
                  <span className={styles.weatherIcon}>{getWeatherEmoji(nextRaceWeather.main)}</span>
                  <div>
                    <div className={styles.weatherTemp}>{nextRaceWeather.temp}°C</div>
                    <div className={styles.weatherDesc}>{nextRaceWeather.description}</div>
                  </div>
                </div>
                <div className={styles.weatherDetails}>
                  <div className={styles.weatherDetail}><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6l3-3"/><path d="M12 8l-3-3"/><path d="M12 22c4-4 6-7.5 6-10.5a6 6 0 1 0-12 0C6 14.5 8 18 12 22z"/></svg></span><span>Humidity</span><span>{nextRaceWeather.humidity}%</span></div>
                  <div className={styles.weatherDetail}><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg></span><span>Wind</span><span>{nextRaceWeather.wind_speed.toFixed(1)} m/s</span></div>
                  <div className={styles.weatherDetail}><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg></span><span>Rain</span><span>{nextRaceWeather.rain_probability}%</span></div>
                  <div className={styles.weatherDetail}><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></svg></span><span>Clouds</span><span>{nextRaceWeather.clouds}%</span></div>
                </div>
                <div className={styles.weatherTyreHint}>
                  <TyreIcon size={14} color={nextRaceWeather.rain_probability > 50 ? '#39B54A' : '#FFC906'} />
                  {nextRaceWeather.rain_probability > 50 ? ' Inter / Wet tyres likely'
                    : nextRaceWeather.temp > 30 ? ' Hard / Medium recommended'
                      : ' Medium / Soft expected'}
                </div>
              </div>
            )}

            {nextRace && (
              <div className={styles.scheduleWidget}>
                <div className={styles.scheduleWidgetHeader}>
                  <ClockIcon size={14} color="rgba(255,255,255,0.4)" />
                  <span>RACE WEEKEND</span>
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
      </section>

      <div className={styles.container}>
        {/* Stats — clickable links */}
        <section className={styles.statsRow}>
          <Link href="/calendar?filter=all" className={styles.statCardGlass}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(160, 217, 248, 0.1)' }}><Flag size={20} color="#a0d9f8" /></div>
            <div className={styles.statValue}>{schedule.length}</div>
            <div className={styles.statLabel}>TOTAL RACES</div>
          </Link>
          <Link href="/calendar?filter=completed" className={styles.statCardGlass}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(57, 181, 74, 0.1)' }}><CheckCircle size={20} color="#39B54A" /></div>
            <div className={styles.statValue}>{schedule.filter(r => new Date(r.date) < new Date()).length}</div>
            <div className={styles.statLabel}>COMPLETED</div>
          </Link>
          <Link href="/calendar?filter=upcoming" className={styles.statCardGlass}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(160, 217, 248, 0.1)' }}><LucideClock size={20} color="#a0d9f8" /></div>
            <div className={styles.statValue}>{schedule.filter(r => new Date(r.date) >= new Date()).length}</div>
            <div className={styles.statLabel}>REMAINING</div>
          </Link>
          <Link href="/standings" className={styles.statCardGlass}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(58, 91, 191, 0.1)' }}><TrophyIcon size={20} color="#3a5bbf" /></div>
            <div className={styles.statValue}>{driverStandings[0]?.Driver.code || '---'}</div>
            <div className={styles.statLabel}>CHAMPIONSHIP LEADER</div>
          </Link>
        </section>

        {/* ===== LATEST UPDATES ===== */}
        <section className={styles.newsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <NewsIcon size={22} color="#a0d9f8" />
              <span>Latest Updates</span>
            </h2>
            <div className={styles.newsControls}>
              {refreshing && <span className={styles.refreshIndicator}><div className={styles.miniSpinner} /></span>}
              <span className={styles.lastUpdated}>
                Updated {newsLastUpdated ? new Date(newsLastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '...'}
              </span>
              <span className={styles.regTag}>
                <BoltIcon size={12} color="#FFC906" /> 2026 REGS
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

          <div className={styles.newsGrid} ref={newsGridRef}>
            {displayedNews.map((item) => {
              const catInfo = getCategoryDetails(item.category);
              const CategoryIcon = catInfo.icon;
              const isExpanded = expandedNews.has(item.id);
              return (
                <div key={item.id} className={`${styles.newsCard} ${item.isBreaking ? styles.breakingCard : ''} ${isExpanded ? styles.newsCardExpanded : ''}`}>
                  {item.isBreaking && (
                    <div className={styles.breakingBanner}>
                      <BoltIcon size={12} color="#a0d9f8" />
                      <span>BREAKING</span>
                    </div>
                  )}
                  <div className={styles.newsCardHeader}>
                    <div className={styles.categoryIconWrap} style={{ background: `linear-gradient(135deg, ${catInfo.color}33, transparent)` }}>
                      <CategoryIcon size={16} color={catInfo.color} className={styles.categoryIcon} />
                    </div>
                    <span className={styles.categoryBadge} style={{ color: catInfo.color, background: catInfo.bg }}>
                      <span className={styles.categoryDot} style={{ background: `linear-gradient(135deg, ${catInfo.color}, transparent)` }} />
                      {catInfo.label}
                    </span>
                    <span className={styles.newsDate}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className={styles.newsTitle}>{item.title}</h3>
                  <p className={`${styles.newsSummary} ${isExpanded ? styles.newsSummaryExpanded : ''}`}>
                    {item.summary}
                  </p>

                  {/* Expanded Details */}
                  {isExpanded && item.extraDetails && (
                    <div className={styles.newsDetails}>
                      {item.extraDetails.split('\n').map((line, i) => (
                        <p key={i} className={styles.detailLine}>{line}</p>
                      ))}
                    </div>
                  )}

                  <div className={styles.newsFooter}>
                    <span className={styles.newsSource}>{item.source}</span>
                    {item.extraDetails && (
                      <button
                        className={`${styles.expandBtn} ${isExpanded ? styles.expandBtnActive : ''}`}
                        onClick={() => toggleNewsExpand(item.id)}
                      >
                        <span>{isExpanded ? 'Read Less' : 'Read More'}</span>
                        <div className={styles.expandIcon}>▼</div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNews.length > 6 && (
            <button
              className={styles.showAllBtn}
              onClick={() => setShowAllNews(!showAllNews)}
            >
              {showAllNews ? `Show Less ▲` : `Show All ${filteredNews.length} Updates ▼`}
            </button>
          )}
        </section>

        {/* Two Column: Standings */}
        <div className={styles.twoCol}>
          <section className={styles.standingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <HelmetIcon size={20} color="#a0d9f8" />
                <span>Driver Standings</span>
              </h2>
              <Link href="/standings" className={styles.seeAll}>See All →</Link>
            </div>
            <div className={styles.standingsList}>
              {driverStandings.slice(0, 10).map((standing, index) => (
                <div key={standing.Driver.driverId} className={styles.standingRow}>
                  <span className={`${styles.position} ${index < 3 ? styles.topPosition : ''}`}>
                    {index === 0 ? <MedalIcon size={16} color="#FFD700" /> :
                      index === 1 ? <MedalIcon size={16} color="#C0C0C0" /> :
                        index === 2 ? <MedalIcon size={16} color="#CD7F32" /> :
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
          </section>

          <section className={styles.standingsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <ConstructorIcon size={20} color="#a0d9f8" />
                <span>Constructors</span>
              </h2>
              <Link href="/standings" className={styles.seeAll}>See All →</Link>
            </div>
            <div className={styles.standingsList}>
              {constructorStandings.slice(0, 10).map((standing, index) => (
                <div key={standing.Constructor.constructorId} className={styles.standingRow}>
                  <span className={`${styles.position} ${index < 3 ? styles.topPosition : ''}`}>
                    {index === 0 ? <MedalIcon size={16} color="#FFD700" /> :
                      index === 1 ? <MedalIcon size={16} color="#C0C0C0" /> :
                        index === 2 ? <MedalIcon size={16} color="#CD7F32" /> :
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
                <FlagIcon size={20} color="#a0d9f8" />
                <span>Last Race Result</span>
              </h2>
              <span className={styles.lastRaceName}>{lastRace.raceName}</span>
            </div>
            <div className={styles.podium}>
              {lastRace.Results.slice(0, 3).map((result, i) => (
                <div key={result.Driver.driverId} className={`${styles.podiumItem} ${styles[`podium${i + 1}`]}`}>
                  <div className={styles.podiumMedal}>
                    <MedalIcon size={32} color={i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32'} />
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

        {/* Quick Links */}
        <section className={styles.quickLinks}>
          <Link href="/calendar" className={styles.quickLink}>
            <div className={styles.quickLinkIconWrap}><CalendarIcon size={28} color="#a0d9f8" /></div>
            <span className={styles.quickLinkTitle}>Race Calendar</span>
            <span className={styles.quickLinkDesc}>Full 2026 season schedule</span>
          </Link>
          <Link href="/predictions" className={styles.quickLink}>
            <div className={styles.quickLinkIconWrap}><TyreIcon size={28} color="#a0d9f8" /></div>
            <span className={styles.quickLinkTitle}>Tyre Strategy</span>
            <span className={styles.quickLinkDesc}>Weather-based pit predictions</span>
          </Link>
          <Link href="/standings" className={styles.quickLink}>
            <div className={styles.quickLinkIconWrap}><TrophyIcon size={28} color="#a0d9f8" /></div>
            <span className={styles.quickLinkTitle}>Championships</span>
            <span className={styles.quickLinkDesc}>Driver & Constructor standings</span>
          </Link>
          <Link href="/records" className={styles.quickLink}>
            <div className={styles.quickLinkIconWrap}><StatsIcon size={28} color="#a0d9f8" /></div>
            <span className={styles.quickLinkTitle}>Records</span>
            <span className={styles.quickLinkDesc}>Historical F1 data & stats</span>
          </Link>
        </section>
      </div>
    </div>
  );
}

// F1 News & Updates Service
// Aggregates live F1 data from APIs + curated 2026 regulation updates
// Auto-refreshes after every race via polling

export interface F1NewsItem {
    id: string;
    title: string;
    summary: string;
    category: 'regulation' | 'transfer' | 'race' | 'technical' | 'breaking' | 'official';
    date: string;
    source: string;
    url?: string;
    teamTag?: string;
    isBreaking?: boolean;
    extraDetails?: string; // full details for expanded view
}

export interface NewsResponse {
    items: F1NewsItem[];
    lastUpdated: string;
    nextRaceDate?: string;
}

// Fetch all updates — returns items + metadata
export async function getLatestUpdates(): Promise<NewsResponse> {
    const updates: F1NewsItem[] = [];
    const now = new Date();

    // ===== 1. LATEST RACE RESULTS =====
    try {
        const response = await fetch('https://api.jolpi.ca/ergast/f1/current/last/results.json', {
            cache: 'no-store',
        });
        if (response.ok) {
            const data = await response.json();
            const race = data.MRData?.RaceTable?.Races?.[0];
            if (race && race.Results) {
                const winner = race.Results[0];
                const p2 = race.Results[1];
                const p3 = race.Results[2];
                const fastest = race.Results.find((r: Record<string, unknown>) => {
                    const fl = r.FastestLap as { rank?: string } | undefined;
                    return fl?.rank === '1';
                });

                // Race winner
                updates.push({
                    id: `race-winner-${race.round}`,
                    title: `${winner.Driver.givenName} ${winner.Driver.familyName} wins the ${race.raceName}!`,
                    summary: `${winner.Constructor.name} driver took a stunning victory at ${race.Circuit.circuitName}. ${p2?.Driver.familyName} (${p2?.Constructor.name}) finished P2, ${p3?.Driver.familyName} (${p3?.Constructor.name}) completed the podium.`,
                    extraDetails: `Full Race Results:\n• P1: ${winner.Driver.givenName} ${winner.Driver.familyName} — ${winner.Time?.time || winner.status}\n• P2: ${p2?.Driver.givenName} ${p2?.Driver.familyName} — ${p2?.Time?.time || p2?.status}\n• P3: ${p3?.Driver.givenName} ${p3?.Driver.familyName} — ${p3?.Time?.time || p3?.status}\n• P4: ${race.Results[3]?.Driver.familyName} — ${race.Results[3]?.Time?.time || race.Results[3]?.status}\n• P5: ${race.Results[4]?.Driver.familyName} — ${race.Results[4]?.Time?.time || race.Results[4]?.status}\n\nCircuit: ${race.Circuit.circuitName}\nDate: ${race.date}\nRound: ${race.round} of ${race.season}`,
                    category: 'race',
                    date: race.date,
                    source: 'Official Race Results',
                    teamTag: winner.Constructor.constructorId,
                    isBreaking: true,
                });

                // Fastest lap
                if (fastest) {
                    const fl = fastest.FastestLap as { Time?: { time: string }; AverageSpeed?: { speed: string } };
                    updates.push({
                        id: `fastest-${race.round}`,
                        title: `Fastest Lap: ${fastest.Driver.familyName} — ${fl?.Time?.time || ''}`,
                        summary: `${fastest.Driver.givenName} ${fastest.Driver.familyName} recorded the fastest lap of the ${race.raceName} for ${fastest.Constructor.name}.`,
                        extraDetails: `Fastest Lap Details:\n• Driver: ${fastest.Driver.givenName} ${fastest.Driver.familyName}\n• Team: ${fastest.Constructor.name}\n• Time: ${fl?.Time?.time || 'N/A'}\n• Average Speed: ${fl?.AverageSpeed?.speed || 'N/A'} km/h`,
                        category: 'race',
                        date: race.date,
                        source: 'Official Timing',
                        teamTag: fastest.Constructor.constructorId,
                    });
                }

                // DNF Report
                const dnfs = race.Results.filter((r: Record<string, unknown>) => r.status !== 'Finished' && !(r.status as string)?.startsWith('+'));
                if (dnfs.length > 0) {
                    updates.push({
                        id: `dnf-${race.round}`,
                        title: `${dnfs.length} retirement${dnfs.length > 1 ? 's' : ''} at the ${race.raceName}`,
                        summary: `${dnfs.map((d: Record<string, unknown>) => {
                            const driver = d.Driver as { familyName: string };
                            return `${driver.familyName} (${(d.status as string)})`;
                        }).join(', ')} did not finish the race.`,
                        extraDetails: dnfs.map((d: Record<string, unknown>) => {
                            const driver = d.Driver as { givenName: string; familyName: string };
                            const constructor = d.Constructor as { name: string };
                            return `• ${driver.givenName} ${driver.familyName} (${constructor.name}) — ${d.status}`;
                        }).join('\n'),
                        category: 'technical',
                        date: race.date,
                        source: 'Race Incidents',
                    });
                }

                // Points scoring positions
                const pointsFinishers = race.Results.filter((r: Record<string, unknown>) => parseFloat(r.points as string) > 0);
                updates.push({
                    id: `points-${race.round}`,
                    title: `Points awarded at ${race.raceName}: ${pointsFinishers.length} drivers score`,
                    summary: `${pointsFinishers.slice(0, 5).map((r: Record<string, unknown>) => {
                        const driver = r.Driver as { code: string };
                        return `${driver.code}: +${r.points}`;
                    }).join(' | ')}`,
                    extraDetails: pointsFinishers.map((r: Record<string, unknown>) => {
                        const driver = r.Driver as { givenName: string; familyName: string };
                        const constructor = r.Constructor as { name: string };
                        return `• P${r.position} ${driver.givenName} ${driver.familyName} (${constructor.name}): +${r.points} pts`;
                    }).join('\n'),
                    category: 'official',
                    date: race.date,
                    source: 'Points Table',
                });
            }
        }
    } catch (error) {
        console.error('Error fetching race news:', error);
    }

    // ===== 2. CHAMPIONSHIP STANDINGS =====
    try {
        const [driversRes, constructorsRes] = await Promise.all([
            fetch('https://api.jolpi.ca/ergast/f1/current/driverstandings.json', { cache: 'no-store' }),
            fetch('https://api.jolpi.ca/ergast/f1/current/constructorstandings.json', { cache: 'no-store' }),
        ]);

        if (driversRes.ok) {
            const data = await driversRes.json();
            const standings = data.MRData?.StandingsTable?.StandingsLists?.[0];
            if (standings?.DriverStandings?.length > 0) {
                const leader = standings.DriverStandings[0];
                const second = standings.DriverStandings[1];
                const third = standings.DriverStandings[2];
                const gap = parseFloat(leader.points) - parseFloat(second.points);

                updates.push({
                    id: 'driver-standings',
                    title: `Championship: ${leader.Driver.familyName} leads by ${gap} points`,
                    summary: `After ${standings.round} races: ${leader.Driver.familyName} (${leader.points}pts) • ${second.Driver.familyName} (${second.points}pts) • ${third.Driver.familyName} (${third.points}pts)`,
                    extraDetails: standings.DriverStandings.slice(0, 10).map((s: Record<string, unknown>) => {
                        const driver = s.Driver as { givenName: string; familyName: string };
                        const constructors = s.Constructors as { name: string }[];
                        return `• P${s.position} ${driver.givenName} ${driver.familyName} (${constructors[0]?.name}) — ${s.points} pts, ${s.wins} wins`;
                    }).join('\n'),
                    category: 'official',
                    date: now.toISOString().split('T')[0],
                    source: 'Driver Championship',
                });
            }
        }

        if (constructorsRes.ok) {
            const data = await constructorsRes.json();
            const standings = data.MRData?.StandingsTable?.StandingsLists?.[0];
            if (standings?.ConstructorStandings?.length > 0) {
                const leader = standings.ConstructorStandings[0];
                updates.push({
                    id: 'constructor-standings',
                    title: `${leader.Constructor.name} lead Constructors' Championship`,
                    summary: `${leader.Constructor.name} top the standings with ${leader.points} points after round ${standings.round}.`,
                    extraDetails: standings.ConstructorStandings.slice(0, 10).map((s: Record<string, unknown>) => {
                        const constructor = s.Constructor as { name: string };
                        return `• P${s.position} ${constructor.name} — ${s.points} pts, ${s.wins} wins`;
                    }).join('\n'),
                    category: 'official',
                    date: now.toISOString().split('T')[0],
                    source: 'Constructor Championship',
                });
            }
        }
    } catch (error) {
        console.error('Error fetching standings news:', error);
    }

    // ===== 3. UPCOMING RACE INFO =====
    let nextRaceDate: string | undefined;
    try {
        const response = await fetch('https://api.jolpi.ca/ergast/f1/current.json', { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            const races = data.MRData?.RaceTable?.Races || [];
            const upcoming = races.find((r: Record<string, unknown>) => new Date(r.date as string) > now);
            if (upcoming) {
                nextRaceDate = upcoming.date as string;
                const daysUntil = Math.ceil((new Date(upcoming.date as string).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const circuit = upcoming.Circuit as { circuitName: string; Location: { locality: string; country: string } };

                updates.push({
                    id: `upcoming-${upcoming.round}`,
                    title: `Next: ${upcoming.raceName} in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
                    summary: `Round ${upcoming.round} at ${circuit.circuitName}, ${circuit.Location.locality}, ${circuit.Location.country}. Race day: ${new Date(upcoming.date as string).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`,
                    extraDetails: `Race Weekend Schedule:\n${upcoming.FirstPractice ? `• FP1: ${(upcoming.FirstPractice as { date: string }).date}` : ''}\n${upcoming.SecondPractice ? `• FP2: ${(upcoming.SecondPractice as { date: string }).date}` : ''}\n${upcoming.ThirdPractice ? `• FP3: ${(upcoming.ThirdPractice as { date: string }).date}` : ''}\n${upcoming.Qualifying ? `• Qualifying: ${(upcoming.Qualifying as { date: string }).date}` : ''}\n${upcoming.Sprint ? `• Sprint: ${(upcoming.Sprint as { date: string }).date}` : ''}\n• Race: ${upcoming.date}\n\nCircuit: ${circuit.circuitName}\nLocation: ${circuit.Location.locality}, ${circuit.Location.country}`,
                    category: 'official',
                    date: now.toISOString().split('T')[0],
                    source: 'Season Calendar',
                });
            }
        }
    } catch (error) {
        console.error('Error fetching upcoming race:', error);
    }

    // ===== 4. LIVE SESSION DATA FROM OPENF1 =====
    try {
        const response = await fetch('https://api.openf1.org/v1/sessions?year=2026&type=Race', {
            cache: 'no-store',
        });
        if (response.ok) {
            const sessions = await response.json();
            if (Array.isArray(sessions) && sessions.length > 0) {
                const latestSession = sessions[sessions.length - 1];
                if (latestSession.session_name) {
                    updates.push({
                        id: `session-${latestSession.session_key}`,
                        title: `Live Data: ${latestSession.session_name} at ${latestSession.circuit_short_name || latestSession.location}`,
                        summary: `Session data available from ${latestSession.location || 'unknown location'}. Country: ${latestSession.country_name || 'N/A'}.`,
                        category: 'technical',
                        date: latestSession.date_start?.split('T')[0] || now.toISOString().split('T')[0],
                        source: 'OpenF1 Live',
                    });
                }
            }
        }
    } catch {
        // OpenF1 might not have 2026 data yet
    }

    // ===== 5. 2026 REGULATION UPDATES =====
    const regulationUpdates: F1NewsItem[] = [
        {
            id: 'reg-2026-engine',
            title: '2026 Power Unit: 50/50 ICE-Electric Hybrid',
            summary: 'The 2026 PU features a 50/50 split between ICE and Electric Motor. MGU-H removed, MGU-K producing 350kW. Total output ~1000HP.',
            extraDetails: 'Key Changes:\n• ICE: 50% of total power (down from ~80%)\n• MGU-K: 350kW output (up from 120kW) — provides 50% of power\n• MGU-H: REMOVED entirely\n• Energy Store: Larger battery capacity\n• Fuel Flow: Reduced to compensate for more electric power\n• New manufacturers: Ford (Red Bull), Audi (Sauber), Honda (Aston Martin)\n\nThis creates closer racing as the electric component is spec-controlled, reducing the performance gap between power unit manufacturers.',
            category: 'regulation',
            date: '2026-01-15',
            source: 'FIA Technical Regulations',
        },
        {
            id: 'reg-2026-aero',
            title: 'Active Aero Replaces DRS — Low Drag Mode Activated',
            summary: 'Manual DRS replaced by active aerodynamics. Front and rear wing elements move to reduce drag by 55% on straights.',
            extraDetails: 'Active Aerodynamics System:\n• Movable front wing elements for corner optimization\n• Rear wing transitions between high-downforce and low-drag modes\n• 55% drag reduction possible (vs ~20% with old DRS)\n• System activates automatically based on position gap\n• Both attacker AND defender can use the system\n• Creates longer slipstream battles and multiple overtaking opportunities\n• X-mode (extra low drag) available in specific zones',
            category: 'regulation',
            date: '2026-01-20',
            source: 'FIA Technical Regulations',
        },
        {
            id: 'reg-2026-weight',
            title: 'Minimum Weight: 768kg — Lighter, Nimbler Cars',
            summary: 'Weight reduced from 798kg to 768kg. Combined with smaller dimensions, cars are far more agile.',
            extraDetails: 'Weight Distribution:\n• Minimum weight: 768kg (was 798kg)\n• 30kg reduction achieved through:\n  - Lighter power units (simpler without MGU-H)\n  - Smaller chassis dimensions\n  - Simplified front wing design\n  - Reduced fuel load (sustainable fuel is lighter)\n• Teams still expected to run ballast for optimal weight distribution',
            category: 'regulation',
            date: '2026-02-01',
            source: 'FIA Regulations',
        },
        {
            id: 'reg-2026-chassis',
            title: 'Smaller Cars: 3400mm Wheelbase, Narrower Width',
            summary: '2026 cars are significantly smaller. Max wheelbase 3400mm (from ~3600mm), improving circuit racing.',
            extraDetails: 'Dimension Changes:\n• Wheelbase: Max 3400mm (reduced from ~3600mm)\n• Overall length: ~200mm shorter\n• Overall width: ~100mm narrower\n• Floor area: Reduced to limit ground effect\n• Diffuser: Redesigned for less "dirty air"\n\nBenefits:\n• Better racing at tight street circuits\n• Lighter weight\n• More agile through chicanes and slow corners\n• Closer following in turbulent air',
            category: 'regulation',
            date: '2026-02-05',
            source: 'FIA Technical Regulations',
        },
        {
            id: 'reg-2026-sustainable',
            title: '100% Sustainable Fuel — Net Zero Racing',
            summary: 'All 2026 cars run on fully sustainable fuel, produced from waste and carbon capture. Part of F1\'s Net Zero 2030.',
            extraDetails: 'Sustainable Fuel Details:\n• 100% sustainable drop-in fuel (was 10% E10 blend)\n• Sources: Municipal waste, carbon capture, non-food biomass\n• Performance: Equivalent energy density to fossil fuels\n• Aramco and Shell leading development\n• Fuel must be "second generation" — no food crop sources\n• Life-cycle carbon reduction: ~65% vs conventional fuel\n• Technology transfer potential for road cars and aviation',
            category: 'regulation',
            date: '2026-02-10',
            source: 'FIA & Formula 1',
        },
        {
            id: 'reg-2026-cost-cap',
            title: 'Cost Cap: $135M with PU Development Allowance',
            summary: 'FIA confirms $135M cost cap for 2026 with extra allowance for new power unit R&D during the transition year.',
            extraDetails: 'Financial Regulations:\n• Cost cap: $135 million (2026)\n• PU development: Additional exemption for transition costs\n• Wind tunnel hours: Further reduced for top teams\n• CFD allocation: Performance-linked restrictions continue\n• New entries: 12-month grace period for increased spending\n• Sprint race bonuses: Additional budget for teams participating\n• Penalty structure: Sporting penalties for breaches >5%',
            category: 'regulation',
            date: '2026-02-15',
            source: 'FIA Financial Regulations',
        },
        {
            id: 'reg-2026-new-teams',
            title: 'Cadillac F1 Joins: 11 Teams, 22 Cars on Grid',
            summary: 'GM\'s Cadillac brand enters as 11th team. First new entry since Haas (2016). Grid expands to 22 cars.',
            extraDetails: 'Cadillac F1 Entry:\n• Full name: Cadillac Formula 1 Team\n• Ownership: General Motors / TWG Global\n• Operations lead: Michael Andretti\n• Factory: Under construction in Indianapolis + UK satellite\n• Power Unit: Initially customer (Ferrari), own PU planned for 2028\n• Drivers: TBA (rumored: Colton Herta + 1 experienced F1 driver)\n• This is the 11th team and first grid expansion since 2016\n• 22 cars on the grid (was 20)\n• Extra prize money distribution agreed with existing teams',
            category: 'transfer',
            date: '2026-01-10',
            source: 'Formula 1 Official',
            isBreaking: true,
        },
        {
            id: 'reg-2026-sprint',
            title: 'Sprint Format: 8 Sprint Weekends Confirmed',
            summary: '8 Sprint race weekends for 2026. Format: Sprint Quali (Fri) → Sprint Race (Sat) → Grand Prix (Sun).',
            extraDetails: 'Sprint Format 2026:\n• 8 Sprint weekends (up from 6 in 2024)\n• Friday: Sprint Qualifying (SQ1, SQ2, SQ3)\n• Saturday: Sprint Race (100km/~30min)\n• Saturday pm: Grand Prix Qualifying\n• Sunday: Grand Prix\n\nSprint Points: 8-7-6-5-4-3-2-1 (top 8)\nNo mandatory tyre rules in Sprint\nParc fermé from Sprint Quali onwards',
            category: 'official',
            date: '2026-02-20',
            source: 'Formula 1',
        },
    ];

    updates.push(...regulationUpdates);

    // Sort by date (newest first), breaking items get priority
    updates.sort((a, b) => {
        if (a.isBreaking && !b.isBreaking) return -1;
        if (!a.isBreaking && b.isBreaking) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return {
        items: updates,
        lastUpdated: now.toISOString(),
        nextRaceDate,
    };
}

import {
    GavelIcon,
    TransferIcon,
    TrophyIcon,
    TechnicalIcon,
    FlashIcon,
    OfficialIcon
} from '@/components/Icons';
import { ElementType } from 'react';

// Get category badge info and icons
export function getCategoryDetails(category: F1NewsItem['category']): {
    label: string;
    color: string;
    bg: string;
    icon: ElementType;
} {
    const info: { [key: string]: { label: string; color: string; bg: string; icon: ElementType } } = {
        regulation: { label: 'REGULATION', color: '#FFC906', bg: 'rgba(255, 201, 6, 0.12)', icon: GavelIcon },
        transfer: { label: 'TRANSFER', color: '#F58020', bg: 'rgba(245, 128, 32, 0.12)', icon: TransferIcon },
        race: { label: 'RACE RESULT', color: '#E10600', bg: 'rgba(225, 6, 0, 0.12)', icon: TrophyIcon },
        technical: { label: 'TECHNICAL', color: '#2293D1', bg: 'rgba(34, 147, 209, 0.12)', icon: TechnicalIcon },
        breaking: { label: 'BREAKING', color: '#E10600', bg: 'rgba(225, 6, 0, 0.2)', icon: FlashIcon },
        official: { label: 'OFFICIAL', color: '#39B54A', bg: 'rgba(57, 181, 74, 0.12)', icon: OfficialIcon },
    };
    return info[category] || info.official;
}


// Calculate auto-refresh interval based on next race
export function getRefreshInterval(nextRaceDate?: string): number {
    if (!nextRaceDate) return 5 * 60 * 1000; // 5 min default

    const now = Date.now();
    const raceTime = new Date(nextRaceDate).getTime();
    const diff = raceTime - now;

    // Race weekend (within 3 days)
    if (diff < 3 * 24 * 60 * 60 * 1000 && diff > 0) return 30 * 1000; // 30 seconds
    // Race day
    if (diff < 24 * 60 * 60 * 1000 && diff > 0) return 15 * 1000; // 15 seconds
    // Just after race (within 2 hours after)
    if (diff > -2 * 60 * 60 * 1000 && diff <= 0) return 10 * 1000; // 10 seconds

    return 3 * 60 * 1000; // 3 min otherwise
}

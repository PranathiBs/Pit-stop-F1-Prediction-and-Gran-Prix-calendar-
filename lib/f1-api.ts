// F1 API Service - Uses Jolpica (Ergast successor) and OpenF1 APIs

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const OPENF1_BASE = 'https://api.openf1.org/v1';

// ====== TYPES ======
export interface Race {
    season: string;
    round: string;
    raceName: string;
    Circuit: Circuit;
    date: string;
    time?: string;
    FirstPractice?: SessionTime;
    SecondPractice?: SessionTime;
    ThirdPractice?: SessionTime;
    Qualifying?: SessionTime;
    Sprint?: SessionTime;
    Results?: RaceResult[];
}

export interface Circuit {
    circuitId: string;
    circuitName: string;
    url: string;
    Location: {
        lat: string;
        long: string;
        locality: string;
        country: string;
    };
}

export interface SessionTime {
    date: string;
    time?: string;
}

export interface Driver {
    driverId: string;
    permanentNumber: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
}

export interface Constructor {
    constructorId: string;
    name: string;
    nationality: string;
    url: string;
}

export interface DriverStanding {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Driver: Driver;
    Constructors: Constructor[];
}

export interface ConstructorStanding {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Constructor: Constructor;
}

export interface RaceResult {
    number: string;
    position: string;
    positionText: string;
    points: string;
    Driver: Driver;
    Constructor: Constructor;
    grid: string;
    laps: string;
    status: string;
    Time?: { millis: string; time: string };
    FastestLap?: {
        rank: string;
        lap: string;
        Time: { time: string };
        AverageSpeed: { units: string; speed: string };
    };
}

export interface QualifyingResult {
    number: string;
    position: string;
    Driver: Driver;
    Constructor: Constructor;
    Q1?: string;
    Q2?: string;
    Q3?: string;
}

// ====== API FUNCTIONS  ======

async function fetchJolpica(endpoint: string) {
    const response = await fetch(`${JOLPICA_BASE}${endpoint}`, {
        next: { revalidate: 300 } // Cache for 5 minutes
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.MRData;
}

// ====== MOCK DATA FOR 2026 (Since Ergast might not have it yet) ======
const MOCK_2026_CALENDAR: Race[] = [
    {
        season: "2026", round: "1", raceName: "Australian Grand Prix",
        date: "2026-03-15", time: "05:00:00Z",
        Circuit: {
            circuitId: "albert_park", circuitName: "Albert Park Grand Prix Circuit", url: "",
            Location: { lat: "-37.8497", long: "144.968", locality: "Melbourne", country: "Australia" }
        }
    },
    {
        season: "2026", round: "2", raceName: "Chinese Grand Prix",
        date: "2026-03-22", time: "07:00:00Z",
        Circuit: {
            circuitId: "shanghai", circuitName: "Shanghai International Circuit", url: "",
            Location: { lat: "31.3389", long: "121.22", locality: "Shanghai", country: "China" }
        }
    },
    {
        season: "2026", round: "3", raceName: "Japanese Grand Prix",
        date: "2026-04-05", time: "05:00:00Z",
        Circuit: {
            circuitId: "suzuka", circuitName: "Suzuka Circuit", url: "",
            Location: { lat: "34.8431", long: "136.541", locality: "Suzuka", country: "Japan" }
        }
    },
    {
        season: "2026", round: "4", raceName: "Bahrain Grand Prix",
        date: "2026-04-19", time: "15:00:00Z",
        Circuit: {
            circuitId: "bahrain", circuitName: "Bahrain International Circuit", url: "",
            Location: { lat: "26.0325", long: "50.5106", locality: "Sakhir", country: "Bahrain" }
        }
    },
    {
        season: "2026", round: "5", raceName: "Saudi Arabian Grand Prix",
        date: "2026-04-26", time: "17:00:00Z",
        Circuit: {
            circuitId: "jeddah", circuitName: "Jeddah Corniche Circuit", url: "",
            Location: { lat: "21.6319", long: "39.1044", locality: "Jeddah", country: "Saudi Arabia" }
        }
    },
    {
        season: "2026", round: "6", raceName: "Miami Grand Prix",
        date: "2026-05-10", time: "19:30:00Z",
        Circuit: {
            circuitId: "miami", circuitName: "Miami International Autodrome", url: "",
            Location: { lat: "25.9581", long: "-80.2389", locality: "Miami", country: "USA" }
        }
    },
    {
        season: "2026", round: "7", raceName: "Emilia Romagna Grand Prix",
        date: "2026-05-24", time: "13:00:00Z",
        Circuit: {
            circuitId: "imola", circuitName: "Autodromo Enzo e Dino Ferrari", url: "",
            Location: { lat: "44.3439", long: "11.7167", locality: "Imola", country: "Italy" }
        }
    },
    {
        season: "2026", round: "8", raceName: "Monaco Grand Prix",
        date: "2026-05-31", time: "13:00:00Z",
        Circuit: {
            circuitId: "monaco", circuitName: "Circuit de Monaco", url: "",
            Location: { lat: "43.7347", long: "7.42056", locality: "Monte-Carlo", country: "Monaco" }
        }
    },
    {
        season: "2026", round: "9", raceName: "Spanish Grand Prix",
        date: "2026-06-14", time: "13:00:00Z",
        Circuit: {
            circuitId: "catalunya", circuitName: "Circuit de Barcelona-Catalunya", url: "",
            Location: { lat: "41.57", long: "2.26111", locality: "Montmeló", country: "Spain" }
        }
    },
    {
        season: "2026", round: "10", raceName: "Canadian Grand Prix",
        date: "2026-06-28", time: "18:00:00Z",
        Circuit: {
            circuitId: "villeneuve", circuitName: "Circuit Gilles Villeneuve", url: "",
            Location: { lat: "45.5", long: "-73.5228", locality: "Montreal", country: "Canada" }
        }
    },
    {
        season: "2026", round: "17", raceName: "Azerbaijan Grand Prix",
        date: "2026-09-20", time: "11:00:00Z",
        Circuit: {
            circuitId: "bak", circuitName: "Baku City Circuit", url: "",
            Location: { lat: "40.3725", long: "49.8533", locality: "Baku", country: "Azerbaijan" }
        }
    },
    {
        season: "2026", round: "18", raceName: "Singapore Grand Prix",
        date: "2026-10-04", time: "12:00:00Z",
        Circuit: {
            circuitId: "marina_bay", circuitName: "Marina Bay Street Circuit", url: "",
            Location: { lat: "1.2914", long: "103.864", locality: "Marina Bay", country: "Singapore" }
        }
    }
];

// Get current season race schedule
export async function getRaceSchedule(season: string = 'current'): Promise<Race[]> {
    try {
        const data = await fetchJolpica(`/${season}.json`);
        const races = data.RaceTable.Races;

        // Fallback to mock for 2026 if API is empty
        if (season === '2026' && races.length === 0) {
            return MOCK_2026_CALENDAR;
        }

        return races;
    } catch (error) {
        console.error('Error fetching race schedule:', error);
        if (season === '2026') return MOCK_2026_CALENDAR;
        return [];
    }
}

// Get driver standings
export async function getDriverStandings(season: string = 'current'): Promise<DriverStanding[]> {
    try {
        const data = await fetchJolpica(`/${season}/driverstandings.json`);
        return data.StandingsTable.StandingsLists[0]?.DriverStandings || [];
    } catch (error) {
        console.error('Error fetching driver standings:', error);
        return [];
    }
}

// Get constructor standings
export async function getConstructorStandings(season: string = 'current'): Promise<ConstructorStanding[]> {
    try {
        const data = await fetchJolpica(`/${season}/constructorstandings.json`);
        return data.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
    } catch (error) {
        console.error('Error fetching constructor standings:', error);
        return [];
    }
}

// Get race results
export async function getRaceResults(season: string = 'current', round?: string): Promise<Race[]> {
    try {
        const endpoint = round
            ? `/${season}/${round}/results.json`
            : `/${season}/results.json`;
        const data = await fetchJolpica(endpoint);
        return data.RaceTable.Races;
    } catch (error) {
        console.error('Error fetching race results:', error);
        return [];
    }
}

// Get qualifying results
export async function getQualifyingResults(season: string, round: string): Promise<QualifyingResult[]> {
    try {
        const data = await fetchJolpica(`/${season}/${round}/qualifying.json`);
        return data.RaceTable.Races[0]?.QualifyingResults || [];
    } catch (error) {
        console.error('Error fetching qualifying results:', error);
        return [];
    }
}

// Get fastest laps for a season
export async function getFastestLaps(season: string = 'current'): Promise<Race[]> {
    try {
        const data = await fetchJolpica(`/${season}/fastest/1/results.json`);
        return data.RaceTable.Races;
    } catch (error) {
        console.error('Error fetching fastest laps:', error);
        return [];
    }
}

// Get circuit info
export async function getCircuitInfo(circuitId: string): Promise<Circuit | null> {
    try {
        const data = await fetchJolpica(`/circuits/${circuitId}.json`);
        return data.CircuitTable.Circuits[0] || null;
    } catch (error) {
        console.error('Error fetching circuit info:', error);
        return null;
    }
}

// Get all circuits
export async function getAllCircuits(): Promise<Circuit[]> {
    try {
        const data = await fetchJolpica('/current/circuits.json');
        return data.CircuitTable.Circuits;
    } catch (error) {
        console.error('Error fetching circuits:', error);
        return [];
    }
}

// Get last race results
export async function getLastRaceResults(): Promise<Race | null> {
    try {
        const data = await fetchJolpica('/current/last/results.json');
        return data.RaceTable.Races[0] || null;
    } catch (error) {
        console.error('Error fetching last race results:', error);
        return null;
    }
}

// Get lap times for a specific race
export async function getLapTimes(season: string, round: string, lap: string): Promise<unknown> {
    try {
        const data = await fetchJolpica(`/${season}/${round}/laps/${lap}.json`);
        return data.RaceTable.Races[0];
    } catch (error) {
        console.error('Error fetching lap times:', error);
        return null;
    }
}

// ====== OpenF1 API - Live Data ======

export interface LiveTimingData {
    driver_number: number;
    meeting_key: number;
    session_key: number;
    date: string;
    [key: string]: unknown;
}

export interface SessionInfo {
    session_key: number;
    session_name: string;
    session_type: string;
    meeting_key: number;
    date_start: string;
    date_end: string;
    location: string;
    country_name: string;
    circuit_short_name: string;
}

// Get latest session info
export async function getLatestSession(): Promise<SessionInfo | null> {
    try {
        const response = await fetch(`${OPENF1_BASE}/sessions?session_key=latest`, {
            next: { revalidate: 60 }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data[0] || null;
    } catch (error) {
        console.error('Error fetching latest session:', error);
        return null;
    }
}

// Get live driver positions
export async function getLivePositions(sessionKey: string = 'latest'): Promise<unknown[]> {
    try {
        const response = await fetch(
            `${OPENF1_BASE}/position?session_key=${sessionKey}`,
            { next: { revalidate: 10 } }
        );
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching live positions:', error);
        return [];
    }
}

// Get live weather data from OpenF1
export async function getLiveWeather(sessionKey: string = 'latest'): Promise<unknown[]> {
    try {
        const response = await fetch(
            `${OPENF1_BASE}/weather?session_key=${sessionKey}`,
            { next: { revalidate: 30 } }
        );
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching live weather:', error);
        return [];
    }
}

// Get stint data (tyre usage)
export async function getStintData(sessionKey: string = 'latest'): Promise<unknown[]> {
    try {
        const response = await fetch(
            `${OPENF1_BASE}/stints?session_key=${sessionKey}`,
            { next: { revalidate: 30 } }
        );
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching stint data:', error);
        return [];
    }
}

// Get drivers list from OpenF1
export async function getOpenF1Drivers(sessionKey: string = 'latest'): Promise<unknown[]> {
    try {
        const response = await fetch(
            `${OPENF1_BASE}/drivers?session_key=${sessionKey}`,
            { next: { revalidate: 300 } }
        );
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching OpenF1 drivers:', error);
        return [];
    }
}

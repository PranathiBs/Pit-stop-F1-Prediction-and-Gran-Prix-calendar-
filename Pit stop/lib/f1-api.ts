// F1 API Service - Uses Jolpica (Ergast successor) and OpenF1 APIs

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const OPENF1_BASE = 'https://api.openf1.org/v1';
const PITSTOP_API_BASE = 'http://localhost:8000'; // FastAPI backend

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
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "George", familyName: "Russell", code: "RUS", driverId: "russell", permanentNumber: "63", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Mercedes", constructorId: "mercedes", nationality: "", url: "" }, grid: "2", laps: "53", status: "Finished", Time: { millis: "5400000", time: "1:32:00.000" }, number: "63" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "1", laps: "53", status: "Finished", Time: { millis: "5402000", time: "+2.000s" }, number: "16" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "4", laps: "53", status: "Finished", Time: { millis: "5410000", time: "+10.000s" }, number: "4" }
        ]
    },
    {
        season: "2026", round: "4", raceName: "Bahrain Grand Prix",
        date: "2026-04-19", time: "15:00:00Z",
        Circuit: {
            circuitId: "bahrain", circuitName: "Bahrain International Circuit", url: "",
            Location: { lat: "26.0325", long: "50.5106", locality: "Sakhir", country: "Bahrain" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "1", laps: "57", status: "Finished", Time: { millis: "5400000", time: "1:33:56.000" }, number: "16" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "3", laps: "57", status: "Finished", Time: { millis: "5402000", time: "+2.445s" }, number: "4" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "57", status: "Finished", Time: { millis: "5406000", time: "+6.102s" }, number: "1" }
        ]
    },
    {
        season: "2026", round: "5", raceName: "Saudi Arabian Grand Prix",
        date: "2026-04-26", time: "17:00:00Z",
        Circuit: {
            circuitId: "jeddah", circuitName: "Jeddah Corniche Circuit", url: "",
            Location: { lat: "21.6319", long: "39.1044", locality: "Jeddah", country: "Saudi Arabia" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "1", laps: "50", status: "Finished", Time: { millis: "5400000", time: "1:24:19.456" }, number: "1" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Sergio", familyName: "Perez", code: "PER", driverId: "perez", permanentNumber: "11", url: "", dateOfBirth: "", nationality: "Mexican" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "50", status: "Finished", Time: { millis: "5403000", time: "+3.200s" }, number: "11" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "4", laps: "50", status: "Finished", Time: { millis: "5411000", time: "+11.100s" }, number: "16" }
        ]
    },
    {
        season: "2026", round: "6", raceName: "Miami Grand Prix",
        date: "2026-05-10", time: "19:30:00Z",
        Circuit: {
            circuitId: "miami", circuitName: "Miami International Autodrome", url: "",
            Location: { lat: "25.9581", long: "-80.2389", locality: "Miami", country: "USA" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "3", laps: "57", status: "Finished", Time: { millis: "5400000", time: "1:30:12.000" }, number: "4" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "1", laps: "57", status: "Finished", Time: { millis: "5407000", time: "+7.612s" }, number: "1" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "57", status: "Finished", Time: { millis: "5409000", time: "+9.221s" }, number: "81" }
        ]
    },
    {
        season: "2026", round: "7", raceName: "Emilia Romagna Grand Prix",
        date: "2026-05-24", time: "13:00:00Z",
        Circuit: {
            circuitId: "imola", circuitName: "Autodromo Enzo e Dino Ferrari", url: "",
            Location: { lat: "44.3439", long: "11.7167", locality: "Imola", country: "Italy" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "1", laps: "63", status: "Finished", Time: { millis: "5400000", time: "1:25:25.252" }, number: "1" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "63", status: "Finished", Time: { millis: "5400700", time: "+0.725s" }, number: "4" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "3", laps: "63", status: "Finished", Time: { millis: "5407000", time: "+7.916s" }, number: "16" }
        ]
    },
    {
        season: "2026", round: "8", raceName: "Monaco Grand Prix",
        date: "2026-05-31", time: "13:00:00Z",
        Circuit: {
            circuitId: "monaco", circuitName: "Circuit de Monaco", url: "",
            Location: { lat: "43.7347", long: "7.42056", locality: "Monte-Carlo", country: "Monaco" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "1", laps: "78", status: "Finished", Time: { millis: "5400000", time: "1:43:22.000" }, number: "16" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "78", status: "Finished", Time: { millis: "5408000", time: "+8.125s" }, number: "81" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Carlos", familyName: "Sainz", code: "SAI", driverId: "sainz", permanentNumber: "55", url: "", dateOfBirth: "", nationality: "Spanish" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "3", laps: "78", status: "Finished", Time: { millis: "5411000", time: "+11.456s" }, number: "55" }
        ]
    },
    {
        season: "2026", round: "9", raceName: "Spanish Grand Prix",
        date: "2026-06-14", time: "13:00:00Z",
        Circuit: {
            circuitId: "catalunya", circuitName: "Circuit de Barcelona-Catalunya", url: "",
            Location: { lat: "41.57", long: "2.26111", locality: "Montmeló", country: "Spain" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "66", status: "Finished", Time: { millis: "5400000", time: "1:28:20.227" }, number: "1" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "66", status: "Finished", Time: { millis: "5402000", time: "+2.219s" }, number: "4" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM", driverId: "hamilton", permanentNumber: "44", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "3", laps: "66", status: "Finished", Time: { millis: "5417000", time: "+17.790s" }, number: "44" }
        ]
    },
    {
        season: "2026", round: "10", raceName: "Canadian Grand Prix",
        date: "2026-06-28", time: "18:00:00Z",
        Circuit: {
            circuitId: "villeneuve", circuitName: "Circuit Gilles Villeneuve", url: "",
            Location: { lat: "45.5", long: "-73.5228", locality: "Montreal", country: "Canada" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "70", status: "Finished", Time: { millis: "5400000", time: "1:30:22.000" }, number: "1" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "3", laps: "70", status: "Finished", Time: { millis: "5403000", time: "+3.879s" }, number: "4" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "George", familyName: "Russell", code: "RUS", driverId: "russell", permanentNumber: "63", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Mercedes", constructorId: "mercedes", nationality: "", url: "" }, grid: "1", laps: "70", status: "Finished", Time: { millis: "5404000", time: "+4.317s" }, number: "63" }
        ]
    },
    {
        season: "2026", round: "11", raceName: "Austrian Grand Prix",
        date: "2026-07-05", time: "13:00:00Z",
        Circuit: {
            circuitId: "red_bull_ring", circuitName: "Red Bull Ring", url: "",
            Location: { lat: "47.2197", long: "14.7647", locality: "Spielberg", country: "Austria" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "1", laps: "71", status: "Finished", Time: { millis: "5400000", time: "1:05:33.000" }, number: "1" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "3", laps: "71", status: "Finished", Time: { millis: "5402000", time: "+2.145s" }, number: "16" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "71", status: "Finished", Time: { millis: "5404000", time: "+4.812s" }, number: "81" }
        ]
    },
    {
        season: "2026", round: "12", raceName: "British Grand Prix",
        date: "2026-07-19", time: "14:00:00Z",
        Circuit: {
            circuitId: "silverstone", circuitName: "Silverstone Circuit", url: "",
            Location: { lat: "52.0786", long: "-1.01694", locality: "Silverstone", country: "UK" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM", driverId: "hamilton", permanentNumber: "44", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "2", laps: "52", status: "Finished", Time: { millis: "5400000", time: "1:21:22.000" }, number: "44" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "52", status: "Finished", Time: { millis: "5401000", time: "+1.345s" }, number: "4" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "George", familyName: "Russell", code: "RUS", driverId: "russell", permanentNumber: "63", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Mercedes", constructorId: "mercedes", nationality: "", url: "" }, grid: "3", laps: "52", status: "Finished", Time: { millis: "5405000", time: "+5.112s" }, number: "63" }
        ]
    },
    {
        season: "2026", round: "13", raceName: "Hungarian Grand Prix",
        date: "2026-08-02", time: "13:00:00Z",
        Circuit: {
            circuitId: "hungaroring", circuitName: "Hungaroring", url: "",
            Location: { lat: "47.5789", long: "19.2486", locality: "Budapest", country: "Hungary" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "70", status: "Finished", Time: { millis: "5400000", time: "1:38:01.000" }, number: "81" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "70", status: "Finished", Time: { millis: "5400600", time: "+0.612s" }, number: "4" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM", driverId: "hamilton", permanentNumber: "44", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "4", laps: "70", status: "Finished", Time: { millis: "5415000", time: "+15.223s" }, number: "44" }
        ]
    },
    {
        season: "2026", round: "14", raceName: "Belgian Grand Prix",
        date: "2026-08-30", time: "13:00:00Z",
        Circuit: {
            circuitId: "spa", circuitName: "Circuit de Spa-Francorchamps", url: "",
            Location: { lat: "50.4372", long: "5.97139", locality: "Spa", country: "Belgium" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "George", familyName: "Russell", code: "RUS", driverId: "russell", permanentNumber: "63", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Mercedes", constructorId: "mercedes", nationality: "", url: "" }, grid: "6", laps: "44", status: "Finished", Time: { millis: "5400000", time: "1:19:57.000" }, number: "63" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM", driverId: "hamilton", permanentNumber: "44", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "3", laps: "44", status: "Finished", Time: { millis: "5400500", time: "+0.526s" }, number: "44" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "5", laps: "44", status: "Finished", Time: { millis: "5401100", time: "+1.173s" }, number: "81" }
        ]
    },
    {
        season: "2026", round: "15", raceName: "Dutch Grand Prix",
        date: "2026-09-06", time: "13:00:00Z",
        Circuit: {
            circuitId: "zandvoort", circuitName: "Circuit Zandvoort", url: "",
            Location: { lat: "52.3888", long: "4.54092", locality: "Zandvoort", country: "Netherlands" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "72", status: "Finished", Time: { millis: "5400000", time: "1:30:45.000" }, number: "4" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "72", status: "Finished", Time: { millis: "5422000", time: "+22.896s" }, number: "1" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "6", laps: "72", status: "Finished", Time: { millis: "5425000", time: "+25.439s" }, number: "16" }
        ]
    },
    {
        season: "2026", round: "16", raceName: "Italian Grand Prix",
        date: "2026-09-13", time: "13:00:00Z",
        Circuit: {
            circuitId: "monza", circuitName: "Autodromo Nazionale di Monza", url: "",
            Location: { lat: "45.6156", long: "9.28111", locality: "Monza", country: "Italy" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "4", laps: "53", status: "Finished", Time: { millis: "5400000", time: "1:14:40.000" }, number: "16" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "53", status: "Finished", Time: { millis: "5402000", time: "+2.664s" }, number: "81" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "53", status: "Finished", Time: { millis: "5406000", time: "+6.153s" }, number: "4" }
        ]
    },
    {
        season: "2026", round: "17", raceName: "Azerbaijan Grand Prix",
        date: "2026-09-20", time: "11:00:00Z",
        Circuit: {
            circuitId: "bak", circuitName: "Baku City Circuit", url: "",
            Location: { lat: "40.3725", long: "49.8533", locality: "Baku", country: "Azerbaijan" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "51", status: "Finished", Time: { millis: "5400000", time: "1:32:58.000" }, number: "81" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "1", laps: "51", status: "Finished", Time: { millis: "5410000", time: "+10.910s" }, number: "16" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "George", familyName: "Russell", code: "RUS", driverId: "russell", permanentNumber: "63", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Mercedes", constructorId: "mercedes", nationality: "", url: "" }, grid: "5", laps: "51", status: "Finished", Time: { millis: "5431000", time: "+31.328s" }, number: "63" }
        ]
    },
    {
        season: "2026", round: "18", raceName: "Singapore Grand Prix",
        date: "2026-10-04", time: "12:00:00Z",
        Circuit: {
            circuitId: "marina_bay", circuitName: "Marina Bay Street Circuit", url: "",
            Location: { lat: "1.2914", long: "103.864", locality: "Marina Bay", country: "Singapore" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "62", status: "Finished", Time: { millis: "5400000", time: "1:40:52.000" }, number: "4" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "62", status: "Finished", Time: { millis: "5420000", time: "+20.945s" }, number: "1" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "5", laps: "62", status: "Finished", Time: { millis: "5441000", time: "+41.823s" }, number: "81" }
        ]
    },
    {
        season: "2026", round: "19", raceName: "United States Grand Prix",
        date: "2026-10-25", time: "19:00:00Z",
        Circuit: {
            circuitId: "americas", circuitName: "Circuit of the Americas", url: "",
            Location: { lat: "30.1328", long: "-97.6411", locality: "Austin", country: "USA" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "1", laps: "56", status: "Finished", Time: { millis: "5400000", time: "1:35:09.000" }, number: "16" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "56", status: "Finished", Time: { millis: "5408000", time: "+8.562s" }, number: "1" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Carlos", familyName: "Sainz", code: "SAI", driverId: "sainz", permanentNumber: "55", url: "", dateOfBirth: "", nationality: "Spanish" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "3", laps: "56", status: "Finished", Time: { millis: "5412000", time: "+12.112s" }, number: "55" }
        ]
    },
    {
        season: "2026", round: "20", raceName: "Mexico City Grand Prix",
        date: "2026-11-01", time: "19:00:00Z",
        Circuit: {
            circuitId: "rodriguez", circuitName: "Autódromo Hermanos Rodríguez", url: "",
            Location: { lat: "19.4042", long: "-99.0907", locality: "Mexico City", country: "Mexico" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Carlos", familyName: "Sainz", code: "SAI", driverId: "sainz", permanentNumber: "55", url: "", dateOfBirth: "", nationality: "Spanish" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "1", laps: "71", status: "Finished", Time: { millis: "5400000", time: "1:40:55.000" }, number: "55" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "3", laps: "71", status: "Finished", Time: { millis: "5404000", time: "+4.125s" }, number: "4" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "4", laps: "71", status: "Finished", Time: { millis: "5415000", time: "+15.879s" }, number: "16" }
        ]
    },
    {
        season: "2026", round: "21", raceName: "São Paulo Grand Prix",
        date: "2026-11-08", time: "17:00:00Z",
        Circuit: {
            circuitId: "interlagos", circuitName: "Autódromo José Carlos Pace", url: "",
            Location: { lat: "-23.7036", long: "-46.6997", locality: "São Paulo", country: "Brazil" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "17", laps: "69", status: "Finished", Time: { millis: "5400000", time: "2:06:54.000" }, number: "1" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Esteban", familyName: "Ocon", code: "OCO", driverId: "ocon", permanentNumber: "31", url: "", dateOfBirth: "", nationality: "French" }, Constructor: { name: "Alpine", constructorId: "alpine", nationality: "", url: "" }, grid: "4", laps: "69", status: "Finished", Time: { millis: "5419000", time: "+19.477s" }, number: "31" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Pierre", familyName: "Gasly", code: "GAS", driverId: "gasly", permanentNumber: "10", url: "", dateOfBirth: "", nationality: "French" }, Constructor: { name: "Alpine", constructorId: "alpine", nationality: "", url: "" }, grid: "13", laps: "69", status: "Finished", Time: { millis: "5422000", time: "+22.532s" }, number: "10" }
        ]
    },
    {
        season: "2026", round: "22", raceName: "Las Vegas Grand Prix",
        date: "2026-11-21", time: "06:00:00Z",
        Circuit: {
            circuitId: "vegas", circuitName: "Las Vegas Strip Circuit", url: "",
            Location: { lat: "36.1147", long: "-115.17", locality: "Las Vegas", country: "USA" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "George", familyName: "Russell", code: "RUS", driverId: "russell", permanentNumber: "63", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Mercedes", constructorId: "mercedes", nationality: "", url: "" }, grid: "1", laps: "50", status: "Finished", Time: { millis: "5400000", time: "1:33:04.000" }, number: "63" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM", driverId: "hamilton", permanentNumber: "44", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "10", laps: "50", status: "Finished", Time: { millis: "5407000", time: "+7.313s" }, number: "44" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Carlos", familyName: "Sainz", code: "SAI", driverId: "sainz", permanentNumber: "55", url: "", dateOfBirth: "", nationality: "Spanish" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "2", laps: "50", status: "Finished", Time: { millis: "5411000", time: "+11.906s" }, number: "55" }
        ]
    },
    {
        season: "2026", round: "23", raceName: "Qatar Grand Prix",
        date: "2026-11-29", time: "17:00:00Z",
        Circuit: {
            circuitId: "losail", circuitName: "Lusail International Circuit", url: "",
            Location: { lat: "25.49", long: "51.4542", locality: "Al Daayen", country: "Qatar" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "1", laps: "57", status: "Finished", Time: { millis: "5400000", time: "1:24:09.000" }, number: "1" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "57", status: "Finished", Time: { millis: "5406000", time: "+6.112s" }, number: "4" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "4", laps: "57", status: "Finished", Time: { millis: "5411000", time: "+11.562s" }, number: "81" }
        ]
    },
    {
        season: "2026", round: "24", raceName: "Abu Dhabi Grand Prix",
        date: "2026-12-06", time: "13:00:00Z",
        Circuit: {
            circuitId: "yas_marina", circuitName: "Yas Marina Circuit", url: "",
            Location: { lat: "24.4672", long: "54.6031", locality: "Abu Dhabi", country: "UAE" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "58", status: "Finished", Time: { millis: "5400000", time: "1:27:01.000" }, number: "4" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "2", laps: "58", status: "Finished", Time: { millis: "5405000", time: "+5.125s" }, number: "81" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "3", laps: "58", status: "Finished", Time: { millis: "5412000", time: "+12.112s" }, number: "16" }
        ]
    },
    {
        season: "2026", round: "25", raceName: "South African Grand Prix",
        date: "2026-12-13", time: "12:00:00Z",
        Circuit: {
            circuitId: "kyalami", circuitName: "Kyalami Grand Prix Circuit", url: "",
            Location: { lat: "-25.9972", long: "28.0772", locality: "Midrand", country: "South Africa" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM", driverId: "hamilton", permanentNumber: "44", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "1", laps: "60", status: "Finished", Time: { millis: "5400000", time: "1:26:05.000" }, number: "44" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "George", familyName: "Russell", code: "RUS", driverId: "russell", permanentNumber: "63", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Mercedes", constructorId: "mercedes", nationality: "", url: "" }, grid: "2", laps: "60", status: "Finished", Time: { millis: "5402000", time: "+2.114s" }, number: "63" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "3", laps: "60", status: "Finished", Time: { millis: "5411000", time: "+11.562s" }, number: "1" }
        ]
    },
    {
        season: "2026", round: "26", raceName: "German Grand Prix",
        date: "2026-12-20", time: "13:00:00Z",
        Circuit: {
            circuitId: "hockenheimring", circuitName: "Hockenheimring", url: "",
            Location: { lat: "49.3278", long: "8.56583", locality: "Hockenheim", country: "Germany" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "George", familyName: "Russell", code: "RUS", driverId: "russell", permanentNumber: "63", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Mercedes", constructorId: "mercedes", nationality: "", url: "" }, grid: "1", laps: "67", status: "Finished", Time: { millis: "5400000", time: "1:23:44.000" }, number: "63" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM", driverId: "hamilton", permanentNumber: "44", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "2", laps: "67", status: "Finished", Time: { millis: "5401000", time: "+1.212s" }, number: "44" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "3", laps: "67", status: "Finished", Time: { millis: "5408000", time: "+8.916s" }, number: "4" }
        ]
    },
    {
        season: "2026", round: "27", raceName: "Portuguese Grand Prix",
        date: "2026-12-27", time: "14:00:00Z",
        Circuit: {
            circuitId: "portimao", circuitName: "Autódromo Internacional do Algarve", url: "",
            Location: { lat: "37.227", long: "-8.6267", locality: "Portimão", country: "Portugal" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Oscar", familyName: "Piastri", code: "PIA", driverId: "piastri", permanentNumber: "81", url: "", dateOfBirth: "", nationality: "Australian" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "66", status: "Finished", Time: { millis: "5400000", time: "1:34:02.000" }, number: "81" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Charles", familyName: "Leclerc", code: "LEC", driverId: "leclerc", permanentNumber: "16", url: "", dateOfBirth: "", nationality: "Monegasque" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "3", laps: "66", status: "Finished", Time: { millis: "5402000", time: "+2.417s" }, number: "16" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "66", status: "Finished", Time: { millis: "5408000", time: "+8.112s" }, number: "1" }
        ]
    },
    {
        season: "2026", round: "28", raceName: "Indian Grand Prix",
        date: "2027-01-03", time: "09:30:00Z",
        Circuit: {
            circuitId: "buddh", circuitName: "Buddh International Circuit", url: "",
            Location: { lat: "28.3481", long: "77.5347", locality: "Greater Noida", country: "India" }
        },
        Results: [
            { position: "1", positionText: "1", points: "25", Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", driverId: "norris", permanentNumber: "4", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "McLaren", constructorId: "mclaren", nationality: "", url: "" }, grid: "1", laps: "60", status: "Finished", Time: { millis: "5400000", time: "1:31:12.000" }, number: "4" },
            { position: "2", positionText: "2", points: "18", Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", driverId: "verstappen", permanentNumber: "1", url: "", dateOfBirth: "", nationality: "Dutch" }, Constructor: { name: "Red Bull", constructorId: "red_bull", nationality: "", url: "" }, grid: "2", laps: "60", status: "Finished", Time: { millis: "5402000", time: "+2.516s" }, number: "1" },
            { position: "3", positionText: "3", points: "15", Driver: { givenName: "Lewis", familyName: "Hamilton", code: "HAM", driverId: "hamilton", permanentNumber: "44", url: "", dateOfBirth: "", nationality: "British" }, Constructor: { name: "Ferrari", constructorId: "ferrari", nationality: "", url: "" }, grid: "5", laps: "60", status: "Finished", Time: { millis: "5415000", time: "+15.312s" }, number: "44" }
        ]
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
export async function getRaceResults(season: string = '2026', round?: string): Promise<Race[]> {
    const targetSeason = season === 'current' ? new Date().getFullYear().toString() : season;

    // Force 2026 to show NO results since it hasn't started
    if (targetSeason === '2026') {
        // Return 2026 calendar but strip any results
        const mockRaces = MOCK_2026_CALENDAR.map(r => ({ ...r, Results: [] }));
        if (round) {
            return mockRaces.filter(r => r.round === round);
        }
        return mockRaces;
    }

    try {
        const endpoint = round
            ? `/${targetSeason}/${round}/results.json`
            : `/${targetSeason}/results.json?limit=1000`;
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
export async function getFastestLaps(season: string = '2026'): Promise<Race[]> {
    const targetSeason = season === 'current' ? new Date().getFullYear().toString() : season;

    // 2026 has no fastest laps yet
    if (targetSeason === '2026') {
        return [];
    }

    try {
        const data = await fetchJolpica(`/${targetSeason}/fastest/1/results.json`);
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

// ====== OpenF1 API - Live Data (High Performance) ======

async function fetchOpenF1(endpoint: string, params: Record<string, string | number> = {}) {
    const url = new URL(`${OPENF1_BASE}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
    });

    try {
        const response = await fetch(url.toString(), {
            next: { revalidate: 10 } // Fast update: 10 seconds
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error(`OpenF1 Error (${endpoint}):`, error);
        return [];
    }
}

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
    const data = await fetchOpenF1('/sessions', { session_key: 'latest' });
    return data[0] || null;
}

// Get live driver positions
export async function getLivePositions(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/position', { session_key: sessionKey });
}

// Get live weather data
export async function getLiveWeather(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/weather', { session_key: sessionKey });
}

// Get stint data (tyre usage)
export async function getStints(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/stints', { session_key: sessionKey });
}

// Get car telemetry (Speed, RPM, Gear) - The "FastF1" style data
export async function getCarData(sessionKey: number | 'latest' = 'latest', driverNumber?: number): Promise<unknown[]> {
    const params: Record<string, string | number> = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    return await fetchOpenF1('/car_data', params);
}

// Get lap intervals (Gaps between drivers)
export async function getIntervalData(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/intervals', { session_key: sessionKey });
}

// Get pit stop details
export async function getPitData(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/pit', { session_key: sessionKey });
}

// Get driver list
export async function getOpenF1Drivers(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/drivers', { session_key: sessionKey });
}

// ------ FAST API FOR LIVE PREDICTIONS ------
export async function getFastPredict(year: number, gp: string) {
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/predict/simulate/${year}/${gp}`);
        if (!response.ok) throw new Error('API offline');
        return await response.json();
    } catch (error) {
        console.error('FastAPI Error:', error);
        return { error: 'Simulation engine warming up...', fallback: true };
    }
}

export async function getFastResults(year: number, gp: string) {
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/results/${year}/${gp}`);
        if (!response.ok) throw new Error('API offline');
        return await response.json();
    } catch (error) {
        console.error('FastAPI Error:', error);
        return null;
    }
}

export async function compareTelemetry(year: number, gp: string, d1: string, d2: string) {
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/telemetry/compare/${year}/${gp}/${d1}/${d2}`);
        if (!response.ok) throw new Error('API offline');
        return await response.json();
    } catch (error) {
        console.error('Comparison Error:', error);
        return null;
    }
}

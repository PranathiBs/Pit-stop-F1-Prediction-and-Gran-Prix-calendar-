// Tyre Strategy Prediction Engine

import { WeatherData, getTrackCondition } from './weather-api';

export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

export interface PitStop {
    lap: number;
    from: TyreCompound;
    to: TyreCompound;
}

export interface Strategy {
    name: string;
    description: string;
    stints: Stint[];
    totalStops: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
    recommended: boolean;
}

export interface Stint {
    compound: TyreCompound;
    startLap: number;
    endLap: number;
    laps: number;
    degradation: 'low' | 'medium' | 'high';
}

export interface CircuitCharacteristics {
    name: string;
    totalLaps: number;
    tyreDegradation: 'low' | 'medium' | 'high';
    pitLossSeconds: number;
    softLifeLaps: number;
    mediumLifeLaps: number;
    hardLifeLaps: number;
    overtakingDifficulty: 'easy' | 'medium' | 'hard';
}

// Circuit data for strategy calculations
export const CIRCUIT_DATA: { [key: string]: CircuitCharacteristics } = {
    'bahrain': {
        name: 'Bahrain International Circuit',
        totalLaps: 57,
        tyreDegradation: 'high',
        pitLossSeconds: 22,
        softLifeLaps: 15,
        mediumLifeLaps: 25,
        hardLifeLaps: 40,
        overtakingDifficulty: 'easy',
    },
    'jeddah': {
        name: 'Jeddah Corniche Circuit',
        totalLaps: 50,
        tyreDegradation: 'low',
        pitLossSeconds: 25,
        softLifeLaps: 20,
        mediumLifeLaps: 30,
        hardLifeLaps: 45,
        overtakingDifficulty: 'hard',
    },
    'albert_park': {
        name: 'Albert Park Circuit',
        totalLaps: 58,
        tyreDegradation: 'medium',
        pitLossSeconds: 24,
        softLifeLaps: 18,
        mediumLifeLaps: 28,
        hardLifeLaps: 42,
        overtakingDifficulty: 'medium',
    },
    'suzuka': {
        name: 'Suzuka International Racing Course',
        totalLaps: 53,
        tyreDegradation: 'medium',
        pitLossSeconds: 23,
        softLifeLaps: 16,
        mediumLifeLaps: 26,
        hardLifeLaps: 38,
        overtakingDifficulty: 'hard',
    },
    'shanghai': {
        name: 'Shanghai International Circuit',
        totalLaps: 56,
        tyreDegradation: 'high',
        pitLossSeconds: 23,
        softLifeLaps: 14,
        mediumLifeLaps: 24,
        hardLifeLaps: 36,
        overtakingDifficulty: 'easy',
    },
    'miami': {
        name: 'Miami International Autodrome',
        totalLaps: 57,
        tyreDegradation: 'high',
        pitLossSeconds: 24,
        softLifeLaps: 16,
        mediumLifeLaps: 26,
        hardLifeLaps: 38,
        overtakingDifficulty: 'medium',
    },
    'imola': {
        name: 'Autodromo Enzo e Dino Ferrari',
        totalLaps: 63,
        tyreDegradation: 'low',
        pitLossSeconds: 25,
        softLifeLaps: 22,
        mediumLifeLaps: 32,
        hardLifeLaps: 48,
        overtakingDifficulty: 'hard',
    },
    'monaco': {
        name: 'Circuit de Monaco',
        totalLaps: 78,
        tyreDegradation: 'low',
        pitLossSeconds: 27,
        softLifeLaps: 30,
        mediumLifeLaps: 45,
        hardLifeLaps: 60,
        overtakingDifficulty: 'hard',
    },
    'catalunya': {
        name: 'Circuit de Barcelona-Catalunya',
        totalLaps: 66,
        tyreDegradation: 'high',
        pitLossSeconds: 22,
        softLifeLaps: 14,
        mediumLifeLaps: 24,
        hardLifeLaps: 36,
        overtakingDifficulty: 'medium',
    },
    'villeneuve': {
        name: 'Circuit Gilles Villeneuve',
        totalLaps: 70,
        tyreDegradation: 'medium',
        pitLossSeconds: 21,
        softLifeLaps: 18,
        mediumLifeLaps: 28,
        hardLifeLaps: 42,
        overtakingDifficulty: 'easy',
    },
    'red_bull_ring': {
        name: 'Red Bull Ring',
        totalLaps: 71,
        tyreDegradation: 'medium',
        pitLossSeconds: 20,
        softLifeLaps: 18,
        mediumLifeLaps: 28,
        hardLifeLaps: 40,
        overtakingDifficulty: 'easy',
    },
    'silverstone': {
        name: 'Silverstone Circuit',
        totalLaps: 52,
        tyreDegradation: 'high',
        pitLossSeconds: 22,
        softLifeLaps: 14,
        mediumLifeLaps: 22,
        hardLifeLaps: 34,
        overtakingDifficulty: 'medium',
    },
    'hungaroring': {
        name: 'Hungaroring',
        totalLaps: 70,
        tyreDegradation: 'low',
        pitLossSeconds: 24,
        softLifeLaps: 22,
        mediumLifeLaps: 34,
        hardLifeLaps: 50,
        overtakingDifficulty: 'hard',
    },
    'spa': {
        name: 'Circuit de Spa-Francorchamps',
        totalLaps: 44,
        tyreDegradation: 'medium',
        pitLossSeconds: 23,
        softLifeLaps: 12,
        mediumLifeLaps: 20,
        hardLifeLaps: 32,
        overtakingDifficulty: 'easy',
    },
    'zandvoort': {
        name: 'Circuit Zandvoort',
        totalLaps: 72,
        tyreDegradation: 'medium',
        pitLossSeconds: 24,
        softLifeLaps: 18,
        mediumLifeLaps: 28,
        hardLifeLaps: 42,
        overtakingDifficulty: 'hard',
    },
    'monza': {
        name: 'Autodromo Nazionale Monza',
        totalLaps: 53,
        tyreDegradation: 'low',
        pitLossSeconds: 24,
        softLifeLaps: 20,
        mediumLifeLaps: 30,
        hardLifeLaps: 45,
        overtakingDifficulty: 'easy',
    },
    'marina_bay': {
        name: 'Marina Bay Street Circuit',
        totalLaps: 62,
        tyreDegradation: 'high',
        pitLossSeconds: 30,
        softLifeLaps: 16,
        mediumLifeLaps: 26,
        hardLifeLaps: 38,
        overtakingDifficulty: 'hard',
    },
    'cota': {
        name: 'Circuit of the Americas',
        totalLaps: 56,
        tyreDegradation: 'high',
        pitLossSeconds: 22,
        softLifeLaps: 15,
        mediumLifeLaps: 24,
        hardLifeLaps: 36,
        overtakingDifficulty: 'easy',
    },
    'rodriguez': {
        name: 'Autódromo Hermanos Rodríguez',
        totalLaps: 71,
        tyreDegradation: 'low',
        pitLossSeconds: 22,
        softLifeLaps: 22,
        mediumLifeLaps: 34,
        hardLifeLaps: 50,
        overtakingDifficulty: 'medium',
    },
    'interlagos': {
        name: 'Interlagos Circuit',
        totalLaps: 71,
        tyreDegradation: 'medium',
        pitLossSeconds: 21,
        softLifeLaps: 18,
        mediumLifeLaps: 28,
        hardLifeLaps: 42,
        overtakingDifficulty: 'easy',
    },
    'vegas': {
        name: 'Las Vegas Street Circuit',
        totalLaps: 50,
        tyreDegradation: 'low',
        pitLossSeconds: 24,
        softLifeLaps: 20,
        mediumLifeLaps: 30,
        hardLifeLaps: 45,
        overtakingDifficulty: 'medium',
    },
    'losail': {
        name: 'Losail International Circuit',
        totalLaps: 57,
        tyreDegradation: 'high',
        pitLossSeconds: 23,
        softLifeLaps: 14,
        mediumLifeLaps: 22,
        hardLifeLaps: 34,
        overtakingDifficulty: 'medium',
    },
    'yas_marina': {
        name: 'Yas Marina Circuit',
        totalLaps: 58,
        tyreDegradation: 'medium',
        pitLossSeconds: 23,
        softLifeLaps: 18,
        mediumLifeLaps: 28,
        hardLifeLaps: 40,
        overtakingDifficulty: 'medium',
    },
};

// Map circuit IDs from API to our circuit data keys  
export function mapCircuitId(apiCircuitId: string): string {
    const mapping: { [key: string]: string } = {
        'bahrain': 'bahrain',
        'jeddah': 'jeddah',
        'albert_park': 'albert_park',
        'suzuka': 'suzuka',
        'shanghai': 'shanghai',
        'miami': 'miami',
        'imola': 'imola',
        'monaco': 'monaco',
        'catalunya': 'catalunya',
        'villeneuve': 'villeneuve',
        'red_bull_ring': 'red_bull_ring',
        'silverstone': 'silverstone',
        'hungaroring': 'hungaroring',
        'spa': 'spa',
        'zandvoort': 'zandvoort',
        'monza': 'monza',
        'marina_bay': 'marina_bay',
        'americas': 'cota',
        'rodriguez': 'rodriguez',
        'interlagos': 'interlagos',
        'las_vegas': 'vegas',
        'losail': 'losail',
        'yas_marina': 'yas_marina',
    };
    return mapping[apiCircuitId] || apiCircuitId;
}

// Adjust tyre life based on temperature
function adjustTyreLifeForTemp(baseLaps: number, airTemp: number): number {
    if (airTemp > 35) return Math.floor(baseLaps * 0.8); // Hot = more degradation
    if (airTemp > 30) return Math.floor(baseLaps * 0.9);
    if (airTemp < 15) return Math.floor(baseLaps * 0.85); // Cold = less grip, more sliding
    return baseLaps;
}

// Predict tyre strategy based on circuit and weather
export function predictStrategy(
    circuitId: string,
    weather: WeatherData
): Strategy[] {
    const circuit = CIRCUIT_DATA[circuitId];
    if (!circuit) {
        return getDefaultStrategies(57, weather); // Default to 57 laps
    }

    const condition = getTrackCondition(weather);
    const totalLaps = circuit.totalLaps;

    // Adjust tyre life for temperature
    const softLife = adjustTyreLifeForTemp(circuit.softLifeLaps, weather.temp);
    const medLife = adjustTyreLifeForTemp(circuit.mediumLifeLaps, weather.temp);
    const hardLife = adjustTyreLifeForTemp(circuit.hardLifeLaps, weather.temp);

    const strategies: Strategy[] = [];

    if (condition === 'VERY_WET') {
        // Full wet strategy
        strategies.push({
            name: 'Full Wet',
            description: 'Heavy rain expected throughout. Full wet compound for maximum safety.',
            stints: [{
                compound: 'WET',
                startLap: 1,
                endLap: totalLaps,
                laps: totalLaps,
                degradation: 'medium',
            }],
            totalStops: 0,
            riskLevel: 'LOW',
            confidence: 85,
            recommended: true,
        });

        strategies.push({
            name: 'Wet → Intermediate',
            description: 'Start on wets, switch to inters if rain eases.',
            stints: [
                { compound: 'WET', startLap: 1, endLap: Math.floor(totalLaps * 0.6), laps: Math.floor(totalLaps * 0.6), degradation: 'medium' },
                { compound: 'INTERMEDIATE', startLap: Math.floor(totalLaps * 0.6) + 1, endLap: totalLaps, laps: totalLaps - Math.floor(totalLaps * 0.6), degradation: 'low' },
            ],
            totalStops: 1,
            riskLevel: 'MEDIUM',
            confidence: 60,
            recommended: false,
        });
    } else if (condition === 'WET') {
        // Intermediate strategy
        strategies.push({
            name: 'Intermediate',
            description: 'Consistent rain. Intermediates offer best balance.',
            stints: [{
                compound: 'INTERMEDIATE',
                startLap: 1,
                endLap: totalLaps,
                laps: totalLaps,
                degradation: 'medium',
            }],
            totalStops: 0,
            riskLevel: 'LOW',
            confidence: 75,
            recommended: true,
        });

        strategies.push({
            name: 'Inter → Dry (Medium)',
            description: 'Track drying expected. Switch to mediums when dry line appears.',
            stints: [
                { compound: 'INTERMEDIATE', startLap: 1, endLap: Math.floor(totalLaps * 0.45), laps: Math.floor(totalLaps * 0.45), degradation: 'medium' },
                { compound: 'MEDIUM', startLap: Math.floor(totalLaps * 0.45) + 1, endLap: totalLaps, laps: totalLaps - Math.floor(totalLaps * 0.45), degradation: 'low' },
            ],
            totalStops: 1,
            riskLevel: 'HIGH',
            confidence: 50,
            recommended: false,
        });
    } else if (condition === 'DAMP') {
        // Mixed conditions
        strategies.push({
            name: 'Inter → Medium → Soft',
            description: 'Damp start, drying track. Aggressive strategy for drying conditions.',
            stints: [
                { compound: 'INTERMEDIATE', startLap: 1, endLap: Math.floor(totalLaps * 0.25), laps: Math.floor(totalLaps * 0.25), degradation: 'medium' },
                { compound: 'MEDIUM', startLap: Math.floor(totalLaps * 0.25) + 1, endLap: Math.floor(totalLaps * 0.7), laps: Math.floor(totalLaps * 0.45), degradation: 'medium' },
                { compound: 'SOFT', startLap: Math.floor(totalLaps * 0.7) + 1, endLap: totalLaps, laps: totalLaps - Math.floor(totalLaps * 0.7), degradation: 'high' },
            ],
            totalStops: 2,
            riskLevel: 'HIGH',
            confidence: 55,
            recommended: false,
        });

        strategies.push({
            name: 'Inter → Hard',
            description: 'Safe option for mixed conditions. Switch to hards on drying track.',
            stints: [
                { compound: 'INTERMEDIATE', startLap: 1, endLap: Math.floor(totalLaps * 0.3), laps: Math.floor(totalLaps * 0.3), degradation: 'medium' },
                { compound: 'HARD', startLap: Math.floor(totalLaps * 0.3) + 1, endLap: totalLaps, laps: totalLaps - Math.floor(totalLaps * 0.3), degradation: 'low' },
            ],
            totalStops: 1,
            riskLevel: 'MEDIUM',
            confidence: 65,
            recommended: true,
        });
    } else {
        // DRY conditions — standard strategies

        // Optimal one-stop: Medium → Hard
        const oneStopMH = Math.min(medLife, Math.floor(totalLaps * 0.45));
        strategies.push({
            name: 'Medium → Hard',
            description: 'Classic one-stop strategy. Good tyre management with hard stint to finish.',
            stints: [
                { compound: 'MEDIUM', startLap: 1, endLap: oneStopMH, laps: oneStopMH, degradation: 'medium' },
                { compound: 'HARD', startLap: oneStopMH + 1, endLap: totalLaps, laps: totalLaps - oneStopMH, degradation: 'low' },
            ],
            totalStops: 1,
            riskLevel: 'LOW',
            confidence: 85,
            recommended: true,
        });

        // One-stop: Hard → Medium
        const oneStopHM = Math.min(hardLife, Math.floor(totalLaps * 0.6));
        strategies.push({
            name: 'Hard → Medium',
            description: 'Conservative start on hard compound. Fresher mediums for the final stint.',
            stints: [
                { compound: 'HARD', startLap: 1, endLap: oneStopHM, laps: oneStopHM, degradation: 'low' },
                { compound: 'MEDIUM', startLap: oneStopHM + 1, endLap: totalLaps, laps: totalLaps - oneStopHM, degradation: 'medium' },
            ],
            totalStops: 1,
            riskLevel: 'LOW',
            confidence: 80,
            recommended: false,
        });

        // Two-stop: Soft → Hard → Medium
        const twoStopS = Math.min(softLife, Math.floor(totalLaps * 0.25));
        const twoStopH = Math.min(hardLife, Math.floor(totalLaps * 0.45));
        strategies.push({
            name: 'Soft → Hard → Medium',
            description: 'Aggressive two-stop. Quick start on softs, manage with hards, push on mediums.',
            stints: [
                { compound: 'SOFT', startLap: 1, endLap: twoStopS, laps: twoStopS, degradation: 'high' },
                { compound: 'HARD', startLap: twoStopS + 1, endLap: twoStopS + twoStopH, laps: twoStopH, degradation: 'low' },
                { compound: 'MEDIUM', startLap: twoStopS + twoStopH + 1, endLap: totalLaps, laps: totalLaps - twoStopS - twoStopH, degradation: 'medium' },
            ],
            totalStops: 2,
            riskLevel: 'MEDIUM',
            confidence: 70,
            recommended: false,
        });

        // Two-stop: Soft → Medium → Soft
        if (circuit.overtakingDifficulty !== 'hard') {
            const aggressiveS1 = Math.min(softLife, Math.floor(totalLaps * 0.22));
            const aggressiveM = Math.min(medLife, Math.floor(totalLaps * 0.4));
            strategies.push({
                name: 'Soft → Medium → Soft',
                description: 'Maximum attack strategy. Two sets of softs for pace advantage.',
                stints: [
                    { compound: 'SOFT', startLap: 1, endLap: aggressiveS1, laps: aggressiveS1, degradation: 'high' },
                    { compound: 'MEDIUM', startLap: aggressiveS1 + 1, endLap: aggressiveS1 + aggressiveM, laps: aggressiveM, degradation: 'medium' },
                    { compound: 'SOFT', startLap: aggressiveS1 + aggressiveM + 1, endLap: totalLaps, laps: totalLaps - aggressiveS1 - aggressiveM, degradation: 'high' },
                ],
                totalStops: 2,
                riskLevel: 'HIGH',
                confidence: 55,
                recommended: false,
            });
        }

        // One-stop: Soft → Hard (if possible)
        if (softLife >= Math.floor(totalLaps * 0.2)) {
            const softStint = Math.min(softLife, Math.floor(totalLaps * 0.3));
            strategies.push({
                name: 'Soft → Hard',
                description: 'Quick start on softs, then manage to the end on hards.',
                stints: [
                    { compound: 'SOFT', startLap: 1, endLap: softStint, laps: softStint, degradation: 'high' },
                    { compound: 'HARD', startLap: softStint + 1, endLap: totalLaps, laps: totalLaps - softStint, degradation: 'low' },
                ],
                totalStops: 1,
                riskLevel: 'MEDIUM',
                confidence: 72,
                recommended: false,
            });
        }
    }

    return strategies;
}

function getDefaultStrategies(totalLaps: number, weather: WeatherData): Strategy[] {
    const condition = getTrackCondition(weather);

    if (condition !== 'DRY') {
        return [{
            name: 'Intermediate Strategy',
            description: 'Wet conditions detected. Use intermediate or wet compounds.',
            stints: [{
                compound: condition === 'VERY_WET' ? 'WET' : 'INTERMEDIATE',
                startLap: 1,
                endLap: totalLaps,
                laps: totalLaps,
                degradation: 'medium',
            }],
            totalStops: 0,
            riskLevel: 'LOW',
            confidence: 70,
            recommended: true,
        }];
    }

    return [
        {
            name: 'Medium → Hard',
            description: 'Standard one-stop strategy.',
            stints: [
                { compound: 'MEDIUM', startLap: 1, endLap: Math.floor(totalLaps * 0.45), laps: Math.floor(totalLaps * 0.45), degradation: 'medium' },
                { compound: 'HARD', startLap: Math.floor(totalLaps * 0.45) + 1, endLap: totalLaps, laps: totalLaps - Math.floor(totalLaps * 0.45), degradation: 'low' },
            ],
            totalStops: 1,
            riskLevel: 'LOW',
            confidence: 80,
            recommended: true,
        },
        {
            name: 'Soft → Hard → Medium',
            description: 'Aggressive two-stop strategy.',
            stints: [
                { compound: 'SOFT', startLap: 1, endLap: 15, laps: 15, degradation: 'high' },
                { compound: 'HARD', startLap: 16, endLap: 38, laps: 23, degradation: 'low' },
                { compound: 'MEDIUM', startLap: 39, endLap: totalLaps, laps: totalLaps - 38, degradation: 'medium' },
            ],
            totalStops: 2,
            riskLevel: 'MEDIUM',
            confidence: 65,
            recommended: false,
        },
    ];
}

// Get tyre compound color
export function getTyreColor(compound: TyreCompound): string {
    const colors: { [key in TyreCompound]: string } = {
        SOFT: '#FF3333',
        MEDIUM: '#FFC906',
        HARD: '#FFFFFF',
        INTERMEDIATE: '#39B54A',
        WET: '#0072C6',
    };
    return colors[compound];
}

// Get tyre compound short name
export function getTyreShort(compound: TyreCompound): string {
    const shorts: { [key in TyreCompound]: string } = {
        SOFT: 'S',
        MEDIUM: 'M',
        HARD: 'H',
        INTERMEDIATE: 'I',
        WET: 'W',
    };
    return shorts[compound];
}

/**
 * Utility for fetching F1 Team Logo URLs from official CDN/Assets
 */

const LOGO_MAP: Record<string, string> = {
    'red_bull': 'Red%20Bull',
    'mercedes': 'Mercedes',
    'ferrari': 'Ferrari',
    'mclaren': 'McLaren',
    'aston_martin': 'Aston%20Martin',
    'alpine': 'Alpine',
    'williams': 'Williams',
    'haas': 'Haas',
    'kick_sauber': 'Kick%20Sauber',
    'sauber': 'Kick%20Sauber',
    'rb': 'RB',
    'alphatauri': 'AlphaTauri',
    'alfa': 'Alfa%20Romeo',
    'racing_point': 'Racing%20Point',
    'toro_rosso': 'Toro%20Rosso',
    'renault': 'Renault',
};

// Fallback for older years or less common constructors
export function getTeamLogo(constructorId: string): string {
    const normalized = constructorId.toLowerCase().replace(/\s+/g, '_');
    const path = LOGO_MAP[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);

    // Official F1 CDN pattern for 2018+ redesign assets
    return `https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/${path}.png`;
}

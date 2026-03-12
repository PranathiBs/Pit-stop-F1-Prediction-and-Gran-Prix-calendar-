// Team colors and utilities for F1 constructors

export const TEAM_COLORS: { [key: string]: string } = {
    'red_bull': '#3671C6',
    'mercedes': '#6CD3BF',
    'ferrari': '#F91536',
    'mclaren': '#F58020',
    'aston_martin': '#358C75',
    'alpine': '#2293D1',
    'williams': '#37BEDD',
    'haas': '#B6BABD',
    'sauber': '#52E252',
    'audi': '#F11C4D',
    'rb': '#6692FF',
    'kick_sauber': '#52E252',
    'alphatauri': '#6692FF',
    'alfa': '#C92D4B',
    'racing_point': '#F596C8',
    'toro_rosso': '#469BFF',
    'renault': '#FFF500',
    'cadillac': '#FFFFFF',
    'andretti': '#0062B2',
};

export function getTeamColor(constructorId: string): string {
    // Normalize constructor ID
    const normalized = constructorId.toLowerCase().replace(/\s+/g, '_');
    return TEAM_COLORS[normalized] || '#888888';
}

export function getTeamGradient(constructorId: string): string {
    const color = getTeamColor(constructorId);
    return `linear-gradient(135deg, ${color}40 0%, ${color}10 100%)`;
}

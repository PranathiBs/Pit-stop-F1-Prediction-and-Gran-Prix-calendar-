import React from 'react';

interface IconProps {
    size?: number;
    color?: string;
    className?: string;
}

// ===== ANIMATED PIT STOP LOGO — F1 CAR DONUT AROUND PS CENTER =====
export function CheckeredFlag({ size = 32, className }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 60 60"
            fill="none"
            className={`${className} ${styles.logoSvg}`}
        >
            <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a0d9f8" />
                    <stop offset="100%" stopColor="#3a5bbf" />
                </linearGradient>
                <filter id="logoGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="carGlow">
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Smoke particle gradient */}
                <radialGradient id="smokeGrad">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
            </defs>

            {/* Inner pulsing glow foundation */}
            <circle cx="30" cy="30" r="14" fill="url(#logoGrad)" opacity="0.05">
                <animate attributeName="r" values="12;15;12" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Main PS Center Text Logo — Replaces Checkered Flag */}
            <g filter="url(#logoGlow)">
                <text
                    x="30"
                    y="36"
                    fill="white"
                    fontSize="18"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="'Orbitron', sans-serif"
                    style={{ letterSpacing: '-1px' }}
                >
                    <tspan fill="#a0d9f8">P</tspan>S
                </text>
                {/* Subtle underline for the PS */}
                <rect x="22" y="38" width="16" height="1.5" fill="#a0d9f8" rx="0.5" />
            </g>

            {/* Outer rotating donut ring — The asphalt road */}
            <circle cx="30" cy="30" r="23" stroke="rgba(255,255,255,0.05)" strokeWidth="7" fill="none" />

            {/* Spinning Tire Marks / Donut Effect */}
            <g className={styles.donutContainer}>
                <circle cx="30" cy="30" r="23" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" strokeDasharray="5 15" strokeLinecap="round" />
                <circle cx="30" cy="30" r="23" stroke="rgba(160,217,248,0.15)" strokeWidth="6" fill="none" strokeDasharray="1 19" strokeLinecap="round" />
            </g>

            {/* Dynamic Smoke Particles — Real Donut Smoke */}
            <g className={styles.smokeGroup}>
                <circle cx="53" cy="30" r="3" fill="url(#smokeGrad)">
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="r" values="2;5;2" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="51" cy="35" r="2" fill="url(#smokeGrad)">
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="r" values="1;4;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
            </g>

            {/* Orbiting F1 Car */}
            <g className={styles.carOrbital} filter="url(#carGlow)">
                {/* Rear wing */}
                <rect x="46.5" y="27" width="1.5" height="6" rx="0.5" fill="#a0d9f8" />
                <path d="M46.5,27 L48,28 M46.5,33 L48,32" stroke="#a0d9f8" strokeWidth="0.5" />

                {/* Car Main Body */}
                <path d="M48,27.5 Q51,27 54,28.5 L56,29.5 L56,30.5 L54,31.5 Q51,33 48,32.5 Z" fill="#a0d9f8" />
                <rect x="48" y="29.2" width="6" height="1.6" rx="0.3" fill="#111" /> {/* Cockpit / Halo area */}

                {/* Front Wing */}
                <path d="M55.5,27.5 L57.5,28 L57.5,32 L55.5,32.5 Z" fill="#a0d9f8" />

                {/* Wheels */}
                <rect x="47.5" y="26" width="2" height="1.5" rx="0.3" fill="#000" />
                <rect x="47.5" y="32.5" width="2" height="1.5" rx="0.3" fill="#000" />
                <rect x="54" y="26.5" width="1.8" height="1.2" rx="0.3" fill="#000" />
                <rect x="54" y="32.3" width="1.8" height="1.2" rx="0.3" fill="#000" />

                {/* Engine Exhaust Flash */}
                <circle cx="46" cy="30" r="1" fill="#ffC906" opacity="0.8">
                    <animate attributeName="r" values="0.5;1.5;0.5" dur="0.1s" repeatCount="indefinite" />
                </circle>
            </g>
        </svg>
    );
}

import styles from '@/components/Icons.module.css';

// ===== NAVIGATION ICONS =====
export function DashboardIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
            <circle cx="12" cy="15" r="1" fill={color} stroke="none" />
        </svg>
    );
}

export function CalendarIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <rect x="7" y="13" width="3" height="3" rx="0.5" fill={color} stroke="none" opacity="0.4" />
            <rect x="14" y="13" width="3" height="3" rx="0.5" fill={color} stroke="none" opacity="0.7" />
            <rect x="7" y="17" width="3" height="2" rx="0.5" fill={color} stroke="none" opacity="0.2" />
        </svg>
    );
}

export function TrophyIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
            <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
            <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
            <path d="M9 21h6" />
            <path d="M12 16v5" />
            <circle cx="12" cy="8" r="1.5" fill={color} stroke="none" opacity="0.5" />
        </svg>
    );
}

export function RacingCarIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Car body */}
            <path d="M2 14h20v3H2z" fill={color} fillOpacity="0.15" />
            <path d="M4 14l2-4h5l1-3h4l2 3h2l2 4" />
            <path d="M2 14h20v3H2z" />
            {/* Wheels */}
            <circle cx="7" cy="17" r="2" fill={color} fillOpacity="0.3" />
            <circle cx="7" cy="17" r="0.8" fill={color} stroke="none" />
            <circle cx="17" cy="17" r="2" fill={color} fillOpacity="0.3" />
            <circle cx="17" cy="17" r="0.8" fill={color} stroke="none" />
            {/* Rear wing */}
            <line x1="3" y1="10" x2="3" y2="13" strokeWidth="1.5" />
            <line x1="2" y1="10" x2="5" y2="10" strokeWidth="1.5" />
            {/* Speed line */}
            <line x1="0" y1="12" x2="2" y2="12" opacity="0.4" />
        </svg>
    );
}

export function StatsIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
            <rect x="5" y="14" width="2" height="6" rx="1" fill={color} fillOpacity="0.2" stroke="none" />
            <rect x="11" y="4" width="2" height="16" rx="1" fill={color} fillOpacity="0.2" stroke="none" />
            <rect x="17" y="10" width="2" height="10" rx="1" fill={color} fillOpacity="0.2" stroke="none" />
            <circle cx="12" cy="4" r="1" fill={color} stroke="none" opacity="0.6" />
        </svg>
    );
}

export function NewsIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z" />
            <path d="M2 6h4" />
            <path d="M2 10h4" />
            <path d="M2 14h4" />
            <path d="M2 18h4v4" />
            <line x1="10" y1="6" x2="18" y2="6" />
            <line x1="10" y1="10" x2="18" y2="10" />
            <line x1="10" y1="14" x2="14" y2="14" />
            <rect x="14" y="13" width="4.5" height="5" rx="1" fill={color} fillOpacity="0.15" />
        </svg>
    );
}

// ===== FEATURE/SECTION ICONS =====
export function WeatherIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
            <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.2" />
        </svg>
    );
}

export function TyreIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" fill={color} fillOpacity="0.1" />
            <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.2" />
            <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
            {/* Tread pattern */}
            <path d="M12 2v3" opacity="0.5" />
            <path d="M12 19v3" opacity="0.5" />
            <path d="M2 12h3" opacity="0.5" />
            <path d="M19 12h3" opacity="0.5" />
            <path d="M4.93 4.93l2.12 2.12" opacity="0.5" />
            <path d="M16.95 16.95l2.12 2.12" opacity="0.5" />
            <path d="M4.93 19.07l2.12-2.12" opacity="0.5" />
            <path d="M16.95 7.05l2.12-2.12" opacity="0.5" />
        </svg>
    );
}

export function SpeedometerIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v2" />
            <path d="M6 12H8" />
            <path d="M16 12h2" />
            <path d="M7.76 7.76l1.41 1.41" />
            <path d="M14.83 9.17l1.41-1.41" />
            {/* Needle */}
            <path d="M12 12l3.5-6" stroke="#a0d9f8" strokeWidth="2" />
            <circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.3" />
            <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
        </svg>
    );
}

export function HelmetIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2C7 2 3 6.5 3 12v3c0 1.5 1 3 2.5 3.5L7 19h10l1.5-.5C20 18 21 16.5 21 15v-3c0-5.5-4-10-9-10z" fill={color} fillOpacity="0.1" />
            <path d="M12 2C7 2 3 6.5 3 12v3c0 1.5 1 3 2.5 3.5L7 19h10l1.5-.5C20 18 21 16.5 21 15v-3c0-5.5-4-10-9-10z" />
            {/* Visor */}
            <path d="M5 12h14c0-4-3-8-7-8s-7 4-7 8z" fill={color} fillOpacity="0.25" />
            <line x1="5" y1="12" x2="19" y2="12" />
            <line x1="3" y1="15" x2="21" y2="15" opacity="0.4" />
        </svg>
    );
}

export function PitStopIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Wrench */}
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            <circle cx="11" cy="13" r="1" fill={color} stroke="none" opacity="0.4" />
        </svg>
    );
}

export function FlagIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill={color} fillOpacity="0.15" />
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
    );
}

export function CircuitIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 15C4 8 8 4 12 4s8 4 8 11" fill="none" />
            <path d="M20 15c0 3-3 5-8 5s-8-2-8-5" />
            <circle cx="12" cy="4" r="1.5" fill="#a0d9f8" stroke="none" />
            <path d="M7 12l2 2" opacity="0.5" />
            <path d="M15 8l2 1" opacity="0.5" />
        </svg>
    );
}

export function LiveIcon({ size = 14, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <circle cx="10" cy="10" r="3" fill="#a0d9f8">
                <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="10" r="6" stroke="#a0d9f8" strokeWidth="1.5" fill="none" opacity="0.4">
                <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="10" r="9" stroke="#a0d9f8" strokeWidth="1" fill="none" opacity="0.15">
                <animate attributeName="r" values="8;10;8" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.15;0;0.15" dur="1.5s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}

export function ConstructorIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="11" width="7" height="10" rx="1" fill={color} fillOpacity="0.1" />
            <rect x="14" y="7" width="7" height="14" rx="1" fill={color} fillOpacity="0.1" />
            <rect x="3" y="11" width="7" height="10" rx="1" />
            <rect x="14" y="7" width="7" height="14" rx="1" />
            <line x1="6.5" y1="15" x2="6.5" y2="18" />
            <line x1="17.5" y1="11" x2="17.5" y2="18" />
            <path d="M10 16h4" strokeDasharray="2 2" />
            <line x1="3" y1="3" x2="21" y2="3" strokeWidth="2.5" stroke="#a0d9f8" />
        </svg>
    );
}

export function ClockIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
            <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" opacity="0.3" />
        </svg>
    );
}

export function MedalIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
            <path d="M11 12 5.12 2.2" />
            <path d="m13 12 5.88-9.8" />
            <circle cx="12" cy="17" r="5" fill={color} fillOpacity="0.15" />
            <circle cx="12" cy="17" r="5" />
            <path d="M12 14v4" strokeWidth="1.5" />
            <path d="M10 16h4" strokeWidth="1.5" />
        </svg>
    );
}

export function BoltIcon({ size = 20, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} fillOpacity="0.15" />
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}

export function GavelIcon({ size = 24, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
            <path d="M12 7v10" />
            <path d="M8 11l4 4 4-4" />
            <path d="M9 12h6" />
        </svg>
    );
}

export function TransferIcon({ size = 24, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M7 21v-4m0 0H3m4 0l-5 5" opacity="0.5" />
            <path d="M17 3v4m0 0h4m-4 0l5-5" opacity="0.5" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" fill={color} fillOpacity="0.2" />
            <path d="M15 12h6" />
            <path d="M3 12h6" />
        </svg>
    );
}

export function TechnicalIcon({ size = 24, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Aerodynamic wing profile icon */}
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill={color} fillOpacity="0.1" />
            <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" fill={color} />
        </svg>
    );
}

export function FlashIcon({ size = 24, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 L13 2 Z" fill={color} fillOpacity="0.1" />
            <path d="M13 3 L4 14 L13 14 L12 21 L21 10 L12 10 L13 3 Z" />
        </svg>
    );
}

export function OfficialIcon({ size = 24, color = 'currentColor', className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
            <circle cx="12" cy="12" r="6" strokeOpacity="0.4" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

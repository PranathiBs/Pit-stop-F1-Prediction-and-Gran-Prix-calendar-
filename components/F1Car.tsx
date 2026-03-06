'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function F1Car({ size = 60, color = '#E10600' }) {
    return (
        <motion.svg
            width={size * 2.5}
            height={size}
            viewBox="0 0 160 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Speed / Motion lines behind car */}
            <motion.line x1="5" y1="20" x2="25" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round"
                animate={{ x: [-10, 10], opacity: [0, 1, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
            <motion.line x1="10" y1="28" x2="40" y2="28" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round"
                animate={{ x: [-20, 20], opacity: [0, 1, 0] }} transition={{ duration: 0.4, repeat: Infinity, ease: 'linear', delay: 0.2 }} />
            <motion.line x1="2" y1="12" x2="15" y2="12" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round"
                animate={{ x: [-5, 5], opacity: [0, 1, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear', delay: 0.1 }} />

            {/* F1 Car Core Body - Detailed Silhouette */}
            <path
                d="M 120 28 L 132 28 C 135 28 138 27 140 25 L 145 20 C 147 18 150 17 155 17 L 158 17 V 19 L 148 24 L 145 29 C 142 32 138 32 135 32 L 65 32 L 62 26 L 55 26 L 50 32 L 35 32 C 30 32 25 31 22 28 L 22 17 L 27 15 L 35 15 L 42 20 L 50 20 L 55 12 L 65 12 L 72 20 L 85 20 L 95 14 L 110 20 Z"
                fill="#111"
            />
            {/* Aerodynamic Carbon Fibre Highlights */}
            <path
                d="M 50 20 L 55 12 L 65 12 L 72 20 Z"
                fill="#222"
            />
            <path
                d="M 110 20 L 95 14 L 85 20 Z"
                fill="#222"
            />
            {/* Front and Rear Wings in Team Color */}
            <path d="M 155 17 L 158 17 V 22 L 150 22 C 147 22 145 21 140 18" fill={color} />
            <path d="M 22 10 L 25 10 V 22 L 20 22 C 15 22 15 20 18 15" fill={color} />
            <rect x="25" y="10" width="8" height="2" fill={color} />

            {/* Cockpit & Halo */}
            <path d="M 65 12 C 70 8 75 8 85 14" stroke="#FFF" strokeWidth="1" fill="none" />
            <circle cx="75" cy="11" r="2.5" fill={color} />

            {/* Open Wheels (Highly Detailed) */}
            <g>
                <circle cx="45" cy="27" r="9" fill="#050505" />
                <circle cx="45" cy="27" r="8" fill="#1C1C1C" />
                <circle cx="45" cy="27" r="4" fill="#333" />
                <circle cx="45" cy="27" r="1.5" fill={color} />
            </g>
            <g>
                <circle cx="130" cy="27" r="9" fill="#050505" />
                <circle cx="130" cy="27" r="8" fill="#1C1C1C" />
                <circle cx="130" cy="27" r="4" fill="#333" />
                <circle cx="130" cy="27" r="1.5" fill={color} />
            </g>

            {/* Glowing Accent (Underfloor/Ground Effect) */}
            <motion.line x1="55" y1="36" x2="115" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round"
                initial={{ opacity: 0.3, filter: 'blur(1px)' }}
                animate={{ opacity: 0.8, filter: 'blur(2px)' }}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
            />
        </motion.svg>
    );
}

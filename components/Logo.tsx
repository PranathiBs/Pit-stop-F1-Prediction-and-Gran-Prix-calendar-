'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Logo({ size = 32, color = '#E10600' }) {
    return (
        <motion.svg
            width={size * 3.5}
            height={size}
            viewBox="0 0 140 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial="initial"
            whileHover="hover"
        >
            {/* Background Slanted Shape (Carbon Fiber look) */}
            <path
                d="M5 35L20 5H135L120 35H5Z"
                fill="#111"
                stroke={color}
                strokeWidth="1"
            />

            {/* Accent Speed Line */}
            <motion.path
                d="M0 38H130"
                stroke={color}
                strokeWidth="2"
                initial={{ pathLength: 0.3, opacity: 0.5 }}
                variants={{
                    hover: { pathLength: 1, opacity: 1, transition: { duration: 0.4 } }
                }}
            />

            {/* PIT STOP Stylized Text */}
            <g style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
                <text x="18" y="27" fill={color} fontSize="20" letterSpacing="-1">PIT</text>
                <text x="62" y="27" fill="white" fontSize="20" letterSpacing="2">STOP</text>
            </g>

            {/* Technical Corner Elements */}
            <rect x="128" y="8" width="2" height="2" fill={color} />
            <rect x="132" y="8" width="2" height="2" fill={color} />
            <motion.rect
                x="128" y="14" width="6" height="12"
                fill={color}
                opacity="0.2"
                variants={{
                    hover: { opacity: 0.6, x: 130 }
                }}
            />
        </motion.svg>
    );
}

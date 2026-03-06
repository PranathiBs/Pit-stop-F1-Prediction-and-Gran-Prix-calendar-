'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Calendar, Trophy, Zap, BarChart3, Clock, Radio, Activity } from 'lucide-react';
import Logo from './Logo';
import styles from './Navigation.module.css';

const navItems = [
    { href: '/', label: 'Dashboard', Icon: Home },
    { href: '/calendar', label: 'Calendar', Icon: Calendar },
    { href: '/standings', label: 'Standings', Icon: Trophy },
    { href: '/predictions', label: 'Strategy', Icon: Zap },
    { href: '/records', label: 'Records', Icon: BarChart3 },
    { href: '/history', label: 'History', Icon: Clock },
];

export default function Navigation() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
            <div className={`${styles.container} glass-card`}>
                <Link href="/" className={styles.logo}>
                    <Logo size={24} />
                </Link>

                <div className={`${styles.links} ${mobileOpen ? styles.open : ''}`}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.link} ${isActive ? styles.active : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <motion.span
                                    className={styles.linkIcon}
                                    whileHover={{ y: -2 }}
                                >
                                    <item.Icon size={18} />
                                </motion.span>
                                <span className={styles.linkLabel}>{item.label}</span>
                                {isActive && (
                                    <motion.span
                                        layoutId="line"
                                        className={styles.activeIndicator}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className={styles.rightSection}>
                    <div className={`${styles.liveIndicator} glass-card`}>
                        <Activity size={14} className={styles.livePulse} />
                        <span className={`${styles.liveText} text-mono`}>LIVE</span>
                    </div>

                    <div className={styles.regBadge}>
                        <span className={styles.regText}>2026 REGS</span>
                    </div>

                    <button
                        className={styles.mobileToggle}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation"
                    >
                        <span className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}>
                            <span />
                            <span />
                            <span />
                        </span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

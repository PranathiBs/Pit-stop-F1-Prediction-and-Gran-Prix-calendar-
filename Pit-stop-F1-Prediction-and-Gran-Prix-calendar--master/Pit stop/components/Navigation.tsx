'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';
import { CheckeredFlag, DashboardIcon, CalendarIcon, TrophyIcon, RacingCarIcon, StatsIcon, LiveIcon } from './Icons';

const navItems = [
    { href: '/', label: 'Dashboard', Icon: DashboardIcon },
    { href: '/calendar', label: 'Calendar', Icon: CalendarIcon },
    { href: '/standings', label: 'Standings', Icon: TrophyIcon },
    { href: '/predictions', label: 'Strategy', Icon: RacingCarIcon },
    { href: '/records', label: 'Records', Icon: StatsIcon },
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
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoFlag}>
                        <CheckeredFlag size={42} />
                    </span>
                    <span className={styles.logoText}>PIT STOP</span>
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
                                <span className={styles.linkIcon}>
                                    <item.Icon size={18} color={isActive ? '#E10600' : 'currentColor'} />
                                </span>
                                <span className={styles.linkLabel}>{item.label}</span>
                                {isActive && <span className={styles.activeIndicator} />}
                            </Link>
                        );
                    })}
                </div>

                <div className={styles.rightSection}>
                    <div className={styles.liveIndicator}>
                        <LiveIcon size={16} />
                        <span className={styles.liveText}>LIVE</span>
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

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CheckeredFlag, DashboardIcon, CalendarIcon, TrophyIcon, RacingCarIcon, StatsIcon, LiveIcon } from './Icons';

const navItems = [
    { href: '/', label: 'Dashboard', Icon: DashboardIcon },
    { href: '/calendar', label: 'Calendar', Icon: CalendarIcon },
    { href: '/standings', label: 'Standings', Icon: TrophyIcon },
    { href: '/predictions', label: 'Strategy', Icon: RacingCarIcon },
    { href: '/records', label: 'Records', Icon: StatsIcon },
    { href: '/history', label: 'History', Icon: LiveIcon },
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
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                scrolled
                    ? 'bg-[rgba(10,10,15,0.85)] backdrop-blur-2xl border-b border-white/[0.08] shadow-lg shadow-black/30'
                    : 'bg-[rgba(10,10,15,0.5)] backdrop-blur-xl border-b border-white/[0.04]'
            )}
        >
            <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-[70px]">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                        <CheckeredFlag size={42} />
                    </span>
                    <span
                        className="text-xl tracking-[4px] text-white font-black uppercase"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        PIT STOP
                    </span>
                </Link>

                {/* Nav Links */}
                <div
                    className={cn(
                        'flex items-center gap-1',
                        'max-md:fixed max-md:top-[70px] max-md:left-0 max-md:right-0 max-md:flex-col max-md:bg-[rgba(10,10,15,0.95)] max-md:backdrop-blur-2xl max-md:border-b max-md:border-white/[0.08] max-md:py-4 max-md:gap-2 max-md:transition-all max-md:duration-300',
                        mobileOpen ? 'max-md:opacity-100 max-md:translate-y-0' : 'max-md:opacity-0 max-md:-translate-y-4 max-md:pointer-events-none'
                    )}
                >
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-200',
                                    isActive
                                        ? 'text-white bg-white/[0.08]'
                                        : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
                                )}
                                onClick={() => setMobileOpen(false)}
                            >
                                <item.Icon size={18} color={isActive ? '#a0d9f8' : 'currentColor'} />
                                <span style={{ fontFamily: 'var(--font-body)' }}>{item.label}</span>
                                {isActive && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[#a0d9f8] rounded-full shadow-[0_0_10px_#a0d9f8]" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#a0d9f8]/10 border border-[#a0d9f8]/20 shadow-[0_0_15px_rgba(160,217,248,0.1)]">
                        <LiveIcon size={14} color="#a0d9f8" />
                        <span className="text-[#a0d9f8] text-xs font-bold tracking-wider animate-pulse" style={{ fontFamily: 'var(--font-display)' }}>
                            LIVE
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                        <span className="text-white/60 text-xs font-bold tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                            2026 REGS
                        </span>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden flex flex-col gap-[5px] w-8 h-8 items-center justify-center"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation"
                    >
                        <span className={cn(
                            'block w-5 h-[2px] bg-white/80 rounded-full transition-all duration-300',
                            mobileOpen && 'translate-y-[7px] rotate-45'
                        )} />
                        <span className={cn(
                            'block w-5 h-[2px] bg-white/80 rounded-full transition-all duration-300',
                            mobileOpen && 'opacity-0'
                        )} />
                        <span className={cn(
                            'block w-5 h-[2px] bg-white/80 rounded-full transition-all duration-300',
                            mobileOpen && '-translate-y-[7px] -rotate-45'
                        )} />
                    </button>
                </div>
            </div>
        </nav>
    );
}

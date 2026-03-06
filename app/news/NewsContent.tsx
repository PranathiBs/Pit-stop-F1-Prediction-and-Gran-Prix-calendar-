'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Search, Filter, Calendar, ExternalLink, Zap, RefreshCw } from 'lucide-react';
import { getCategoryDetails, type F1NewsItem } from '@/lib/f1-news';
import styles from './news.module.css';

export default function NewsContent() {
    const [news, setNews] = useState<F1NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/news');
            const data = await res.json();
            setNews(data?.items || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const filteredNews = news.filter(item => {
        const matchesTab = filter === 'all' || item.category === filter;
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.summary.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <Newspaper size={32} color="#E10600" />
                    <h1 className={styles.title}>F1 News Central</h1>
                    <p className={styles.subtitle}>Official updates, regulation leaks, and technical insights.</p>
                </div>

                <div className={styles.controls}>
                    <div className={styles.searchBar}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search news..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className={styles.refreshBtn} onClick={fetchNews}>
                        <RefreshCw size={16} className={loading ? styles.spinning : ''} />
                    </button>
                </div>
            </div>

            <div className={styles.tabs}>
                {['all', 'race', 'official', 'regulation', 'transfer', 'technical'].map(cat => (
                    <button
                        key={cat}
                        className={`${styles.tab} ${filter === cat ? styles.tabActive : ''}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className={styles.loader}>
                    <div className={styles.spinner} />
                    <p>FETCHING DATASTREAM...</p>
                </div>
            ) : (
                <motion.div
                    className={styles.grid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredNews.map((item) => {
                            const cat = getCategoryDetails(item.category);
                            const Icon = cat.icon;
                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={styles.card}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.badge} style={{ color: cat.color, background: cat.bg }}>
                                            <Icon size={12} />
                                            <span>{cat.label}</span>
                                        </div>
                                        <span className={styles.date}>{new Date(item.date).toLocaleDateString()}</span>
                                    </div>

                                    <h3 className={styles.newsTitle}>{item.title}</h3>
                                    <p className={styles.newsSummary}>{item.summary}</p>

                                    <div className={styles.cardFooter}>
                                        <span className={styles.source}>{item.source}</span>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                            Read More <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}

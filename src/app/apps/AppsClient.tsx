'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { useAppData } from '@/context/AppContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';
import { Package, Search, ChevronDown, Filter, Star, Download } from 'lucide-react';
import LucideIcon from '@/components/LucideIcon';
import styles from './apps.module.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } as any
  }
};

export default function AppsClient() {
  const { apps, loading } = useAppData();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('category') || 'all';
  
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState('Newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setFilter(cat);
  }, [searchParams]);

  const categories = useMemo(() => {
    const cats = new Map();
    apps.forEach(app => {
      if (app.categoryId && app.categoryName && app.categoryId !== 'N/A') {
        cats.set(app.categoryId, app.categoryName);
      }
    });
    return Array.from(cats.entries());
  }, [apps]);

  const filteredApps = useMemo(() => {
    let result = [...apps];

    if (filter !== 'all') {
      result = result.filter(app => app.categoryId === filter);
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(app => 
        app.name.toLowerCase().includes(lowerSearch) || 
        app.tagline.toLowerCase().includes(lowerSearch) ||
        app.description.toLowerCase().includes(lowerSearch)
      );
    }
    if (sort === 'Most Downloaded') {
      result.sort((a, b) => b.downloads - a.downloads);
    } else if (sort === 'Newest') {
      result.sort((a, b) => (b.releaseDate?.toMillis() || 0) - (a.releaseDate?.toMillis() || 0));
    }
    return result;
  }, [apps, filter, sort, search]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="loader" />
        <p className="mono" style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
          <div>
            <h1 className={styles.title}>The App Store</h1>
            <p className={styles.subtitle}>Discover the complete collection of CodeByKavin software.</p>
          </div>
          <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input 
                type="text"
                className={styles.searchInput}
                placeholder="Search creations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
          </div>
      </header>

      {/* Modern Filter Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.filterGroup}>
            <div className={styles.selectWrapper}>
                <Filter size={14} className={styles.selectIcon} />
                <select 
                    className={styles.select}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    {categories.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
            </div>

            <div className={styles.selectWrapper}>
                <select 
                    className={styles.select}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <option value="Newest">Newest First</option>
                    <option value="Most Downloaded">Most Downloaded</option>
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
            </div>
        </div>
        <div className={styles.resultCount}>
            {filteredApps.length} {filteredApps.length === 1 ? 'Creation' : 'Creations'}
        </div>
      </div>

      {/* App Grid */}
      <motion.div 
        className={styles.appGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {filteredApps.map(app => (
            <motion.div
              layout
              variants={itemVariants}
              key={app.id}
            >
              <Link href={`/apps/${app.id}`} className={`${styles.appCard} card-glass`}>
                <div className={styles.cardHeader}>
                  <div className={styles.appIconWrapper}>
                    <LucideIcon name={app.icon} size={24} />
                  </div>
                  <div>
                    <h3 className={styles.appName}>{app.name}</h3>
                    <div className={styles.appMeta}>
                        <span className="mono">v{app.version}</span>
                        <span className={styles.dot} />
                        <span>{app.categoryName}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.appTagline}>{app.tagline}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.stats}>
                    <span className={styles.rating}><Star size={12} fill="currentColor" /> {app.rating?.toFixed(1) || '0.0'}</span>
                    <span className={styles.downloadsCount}>
                        <Download size={12} /> {(app.downloads || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className={styles.exploreBtn}>Explore</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredApps.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.emptyState}>
            <p>No matches found for your criteria.</p>
            <button className={styles.resetBtn} onClick={() => {setSearch(''); setFilter('all');}}>Reset Filters</button>
        </motion.div>
      )}
    </div>
  );
}

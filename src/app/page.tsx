'use client';

import { useAppData } from '@/context/AppContext';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { Rocket, DownloadCloud, LayoutGrid, CalendarCheck, Gamepad2, Wrench, FlaskConical, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

const iconMap: Record<string, React.ReactNode> = {
  'calendar-check': <CalendarCheck size={28} />,
  'gamepad-2': <Gamepad2 size={28} />,
  'wrench': <Wrench size={28} />,
  'flask-conical': <FlaskConical size={28} />,
  'layout-grid': <LayoutGrid size={28} />,
};

// Animation Variants for Staggered Snappy Entry
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as any
  }
};

export default function Home() {
  const { apps, developer, loading } = useAppData();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="loader" />
        <p className="mono" style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading...</p>
      </div>
    );
  }

  const featuredApp = developer?.featuredAppId 
    ? apps.find(a => a.id === developer.featuredAppId) 
    : apps[0];
  
  const updates = apps.slice(0, 4);

  const categories = [
    { name: 'Productivity', icon: 'calendar-check', color: 'var(--emerald-500)' },
    { name: 'Fun', icon: 'gamepad-2', color: 'var(--emerald-400)' },
    { name: 'Tools', icon: 'wrench', color: 'var(--emerald-500)' },
    { name: 'Experiments', icon: 'flask-conical', color: 'var(--emerald-400)' },
  ];

  return (
    <motion.div 
      className={styles.pageContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section className={styles.hero} variants={itemVariants}>
        <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                    <span className={styles.badge}>Build with Passion & Pixels</span>
                </motion.div>
                <h1 className={styles.heroTitle}>
                    CodeBy<span className={styles.heroHighlight}>Kavin</span>
                </h1>
                <p className={styles.heroSubtitle}>
                    Exploring the intersection of logic and creativity through a curated collection of experimental applications.
                </p>
                <div className={styles.heroActions}>
                    <Link href="/apps" className={styles.ctaPrimary}>
                        <Rocket size={18} />
                        <span>Explore Creations</span>
                    </Link>
                    <Link href="/about" className={styles.ctaSecondary}>
                        Learn More
                    </Link>
                </div>
            </div>
        </div>
      </motion.section>

      {/* Featured Highlight */}
      {featuredApp && (
        <motion.section className={styles.section} variants={itemVariants}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Editor's Choice</h2>
            <Link href="/apps" className={styles.viewAll}>View Store <ArrowRight size={14} /></Link>
          </div>
          <Link href={`/apps/${featuredApp.id}`} className={`${styles.featuredCard} card-glass`}>
            <div className={styles.featuredContent}>
              <div className={styles.featuredBadge}>FEATURED APP</div>
              <h3 className={styles.featuredTitle}>{featuredApp.name}</h3>
              <p className={styles.featuredTagline}>{featuredApp.tagline}</p>
              <p className={styles.featuredDesc}>{featuredApp.description?.substring(0, 160)}...</p>
              <div className={styles.statsBadge}>
                <DownloadCloud size={14} />
                <span className="mono">{featuredApp.downloads >= 1000 ? (featuredApp.downloads/1000).toFixed(1)+'K' : featuredApp.downloads} Downloads</span>
              </div>
            </div>
            {featuredApp.screenshots && featuredApp.screenshots[0] && (
              <div className={styles.featuredImageWrapper}>
                <img
                  src={featuredApp.screenshots[0]}
                  alt={`${featuredApp.name} preview`}
                  loading="eager"
                  className={styles.featuredImage}
                />
              </div>
            )}
          </Link>
        </motion.section>
      )}

      {/* Categories Grid */}
      <motion.section className={styles.section} variants={itemVariants}>
        <h2 className={styles.sectionTitle}>Categories</h2>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => (
            <Link key={cat.name} href={`/apps?category=${cat.name.toLowerCase()}`} className={`${styles.categoryCard} card-glass`}>
              <div className={styles.categoryIcon} style={{ background: `rgba(16, 185, 129, 0.05)`, color: cat.color }}>
                {iconMap[cat.icon]}
              </div>
              <div>
                <p className={styles.categoryName}>{cat.name}</p>
                <p className={styles.categoryMeta}>Browse {cat.name.toLowerCase()}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Updates Scroll */}
      {updates.length > 0 && (
        <motion.section className={styles.section} variants={itemVariants}>
          <h2 className={styles.sectionTitle}>Latest Updates</h2>
          <div className={styles.updatesContainer}>
            {updates.map(app => (
              <Link key={app.id} href={`/apps/${app.id}`} className={`${styles.updateCard} card-glass`}>
                <div className={styles.updateHeader}>
                  <div className={styles.updateDot} />
                  <span className={styles.updateVersion}>v{app.version}</span>
                </div>
                <h4 className={styles.updateTitle}>{app.name}</h4>
                <p className={styles.updateDate}>
                  {app.releaseDate 
                    ? app.releaseDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Recent'}
                </p>
                <p className={styles.updateDesc}>The latest iteration of {app.name} is now available with refined features.</p>
              </Link>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}

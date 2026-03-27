'use client';

import { useAppData } from '@/context/AppContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Package, Download, Play, ChevronLeft, ChevronRight, Share2, ArrowLeft, Star, Calendar, Info, Clock, ExternalLink } from 'lucide-react';
import LucideIcon from '@/components/LucideIcon';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, legacyAppId } from '@/lib/firebase';
import StarRating from '@/components/StarRating';
import styles from './detail.module.css';

interface ChangelogEntry {
  id: string;
  version: string;
  date: any;
  notes: string;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as any
  }
};

export default function AppDetailClient() {
  const { apps, developer, loading, incrementDownloads, submitAppRating } = useAppData();
  const params = useParams();
  const router = useRouter();
  const appId = params?.id as string;
  
  const [app, setApp] = useState<any>(null);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    if (!loading && apps.length > 0) {
      const foundApp = apps.find(a => a.id === appId);
      if (foundApp) {
        setApp(foundApp);
      } else {
        router.push('/404');
      }
    }
  }, [loading, apps, appId, router]);

  useEffect(() => {
    if (appId) {
      const fetchChangelog = async () => {
        try {
          const APP_DATA_PATH = `artifacts/${legacyAppId}/public/data/apps`;
          const q = query(
            collection(db, `${APP_DATA_PATH}/${appId}/changelog`),
            orderBy('date', 'desc')
          );
          const snap = await getDocs(q);
          setChangelog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChangelogEntry)));
        } catch (error) {
          console.error('No changelog found or error fetching:', error);
        }
      };
      fetchChangelog();
    }
  }, [appId]);

  if (loading || !app) {
    return (
      <div className={styles.loadingContainer}>
        <div className="loader" />
        <p className="mono" style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading...</p>
      </div>
    );
  }

  const screenshots = app.screenshots && app.screenshots.length > 0 
    ? app.screenshots 
    : ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23000000'/%3E%3Cstop offset='1' stop-color='%230A0A0A'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23g)'/%3E%3Crect x='96' y='96' width='608' height='408' rx='12' fill='none' stroke='%2310b981' stroke-opacity='.2' stroke-width='2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2310b981' font-family='monospace' font-size='14'%3EPREVIEW_UNAVAILABLE%3C/text%3E%3C/svg%3E"];

  const handleNextImage = (e: any) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % screenshots.length);
  };

  const handlePrevImage = (e: any) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return 'Recent';
  };

  const handleDownload = (type: string) => {
    incrementDownloads(app.id);
    if (type === 'apk') {
        // APK download handles itself via 'download' prop on <a>, 
        // but we trigger the count increment here.
    }
  };

  const shareApp = async () => {
    const shareData = {
        title: `Check out ${app.name} on CodeByKavin`,
        text: `I found this cool app, ${app.name}, on Kavin's personal app store!`,
        url: window.location.href,
    };
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className={styles.pageContainer}
    >
      <motion.button variants={itemVariants} onClick={() => router.push('/apps')} className={styles.backButton}>
        <ArrowLeft size={16} />
        Store
      </motion.button>

      <div className={styles.layoutGrid}>
        <div className={styles.mainColumn}>
          <motion.div variants={itemVariants} className={styles.headerArea}>
            <div className={styles.appIconContainer}>
              <LucideIcon name={app.icon} size={32} />
            </div>
            <div>
              <h1 className={styles.appName}>{app.name}</h1>
              <div className={styles.appMeta}>
                  <span className={styles.categoryBadge}>{app.categoryName}</span>
                  <span className={styles.versionBadge}>v{app.version}</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={`${styles.carousel} card-glass`}>
            {screenshots.length > 1 && (
              <button className={`${styles.carouselBtn} ${styles.prevBtn}`} onClick={handlePrevImage}>
                <ChevronLeft size={20} />
              </button>
            )}
            <img 
              src={screenshots[currentImageIdx]} 
              alt={`${app.name} Screenshot`} 
              className={styles.mainScreenshot}
              onClick={() => setLightboxOpen(true)}
            />
            {screenshots.length > 1 && (
              <button className={`${styles.carouselBtn} ${styles.nextBtn}`} onClick={handleNextImage}>
                <ChevronRight size={20} />
              </button>
            )}
            <div className={styles.carouselCounter}>
                {currentImageIdx+1} / {screenshots.length}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={styles.section}>
              <div className={styles.sectionHeader}>
                  <Info size={18} className={styles.sectionIcon} />
                  <h2 className={styles.sectionTitle}>Overview</h2>
              </div>
              <p className={styles.tagline}>{app.tagline}</p>
              <p className={styles.description}>{app.description}</p>
          </motion.div>

          <motion.div variants={itemVariants} className={styles.section}>
            <div className={styles.sectionHeader}>
                <Clock size={18} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Release Cycle</h2>
            </div>
            <div className={styles.changelogContainer}>
                {changelog.length === 0 ? (
                <p className={styles.emptyText}>Deployment history is currently private.</p>
                ) : (
                <div className={styles.changelogList}>
                    {(showAllLogs ? changelog : changelog.slice(0, 1)).map((log) => (
                    <div key={log.id} className={`${styles.changelogItem} card-glass`}>
                        <div className={styles.logHeader}>
                            <span className={styles.logVersion}>Version {log.version}</span>
                            <span className={styles.logDate}>{formatDate(log.date)}</span>
                        </div>
                        <p className={styles.logNotes}>{log.notes}</p>
                    </div>
                    ))}
                    
                    {changelog.length > 1 && (
                    <button 
                        className={styles.toggleLogsBtn} 
                        onClick={() => setShowAllLogs(!showAllLogs)}
                    >
                        {showAllLogs ? 'Show Less History' : 'View Full Changelog'}
                    </button>
                    )}
                </div>
                )}
            </div>
          </motion.div>
        </div>

        <div className={styles.sidebarColumn}>
          <motion.div variants={itemVariants} className={`${styles.downloadCard} card-glass`}>
            <h3 className={styles.sidebarTitle}>Deployment</h3>
            
            <div className={styles.actionButtons}>
              {app.apkUrl && (
                <a href={app.apkUrl} download onClick={() => handleDownload('apk')} className={styles.apkButton}>
                  <Download size={18} />
                  Download APK
                </a>
              )}
              {app.playStoreUrl && (
                <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleDownload('play')} className={styles.playButton}>
                  <Play size={18} />
                  Get on Play Store
                </a>
              )}
              <button 
                className={styles.shareButton}
                onClick={shareApp}
              >
                <Share2 size={18} />
                Share Creation
              </button>
            </div>
            
            <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Rating</span>
                    <span className={styles.statValue} style={{ color: 'var(--accent-primary)' }}><Star size={12} fill="currentColor" /> {app.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Downloads</span>
                    <span className={styles.statValue}>{app.downloads.toLocaleString()}</span>
                </div>
                <div className={styles.statBox} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.statLabel}>Updated</span>
                    <span className={styles.statValue}><Calendar size={12} /> {formatDate(app.releaseDate)}</span>
                </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
              <StarRating appId={app.id} onRate={(r) => submitAppRating(app.id, r)} />
          </motion.div>

          <motion.div variants={itemVariants} className={`${styles.developerCard} card-glass`}>
              <div className={styles.devHeader}>
                  <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '1px solid var(--accent-primary)',
                      background: 'rgba(16, 185, 129, 0.1)'
                  }}>
                    <img src={developer?.profileImageUrl || ""} alt={developer?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                      <p className={styles.devName}>{developer?.name || "Kavin"}</p>
                      <p className={styles.devRole}>{developer?.city || "Developer"}</p>
                  </div>
              </div>
              <Link href="/about" className={styles.profileLink}>
                  Explore Developer Profile <ExternalLink size={12} />
              </Link>
          </motion.div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
          {lightboxOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={styles.lightboxOverlay} 
                onClick={() => setLightboxOpen(false)}
            >
              <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
                <button className={styles.lightboxClose} onClick={() => setLightboxOpen(false)}>&times;</button>
                <img src={screenshots[currentImageIdx]} alt="Zoomed Screenshot" className={styles.lightboxImage} />
                {screenshots.length > 1 && (
                  <>
                    <button className={`${styles.carouselBtn} ${styles.prevBtn}`} onClick={handlePrevImage}>
                      <ChevronLeft size={32} />
                    </button>
                    <button className={`${styles.carouselBtn} ${styles.nextBtn}`} onClick={handleNextImage}>
                      <ChevronRight size={32} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
}

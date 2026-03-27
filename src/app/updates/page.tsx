'use client';

import { useAppData } from '@/context/AppContext';
import { motion, Variants } from 'framer-motion';
import { Package, Clock, ArrowRight } from 'lucide-react';
import LucideIcon from '@/components/LucideIcon';
import Link from 'next/link';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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

export default function UpdatesPage() {
  const { apps, loading } = useAppData();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="loader" />
        <p className="mono" style={{ color: 'var(--text-muted)', marginTop: '1.5rem' }}>Loading...</p>
      </div>
    );
  }

  const sortedApps = [...apps].sort((a, b) => 
    (b.releaseDate?.toMillis() || 0) - (a.releaseDate?.toMillis() || 0)
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 0' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 1rem' }}>
              Release <span style={{ color: 'var(--accent-primary)' }}>Logs</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', fontWeight: 500 }}>
              The chronological journey of CodeByKavin software.
          </p>
      </header>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {sortedApps.map((app) => (
          <motion.div 
            key={app.id}
            variants={itemVariants}
          >
            <Link href={`/apps/${app.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="card-glass" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '12px', 
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <LucideIcon name={app.icon} size={24} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{app.name}</h2>
                            <span style={{ 
                                fontFamily: 'Space Mono, monospace', 
                                color: 'var(--text-muted)', 
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                v{app.version}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <Clock size={12} color="var(--accent-primary)" />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
                                {app.releaseDate ? app.releaseDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </span>
                        </div>
                        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                            {app.tagline}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.8125rem', fontWeight: 700 }}>
                            View App Report <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            </Link>
          </motion.div>
        ))}
        {sortedApps.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 0' }}>No deployment cycles detected.</p>}
      </motion.div>
    </div>
  );
}

'use client';

import { useAppData } from '@/context/AppContext';
import { motion, Variants } from 'framer-motion';
import { Mail, Globe, Code, Zap, MapPin, Linkedin, Github, Package } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } as any
  }
};

export default function AboutClient() {
  const { developer, loading, apps } = useAppData();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loader" />
        <p className="mono" style={{ color: 'var(--text-muted)', marginTop: '1.5rem' }}>Loading...</p>
      </div>
    );
  }

  const getLinkIcon = (url: string) => {
    if (url.includes('linkedin.com')) return <Linkedin size={18} />;
    if (url.includes('github.com')) return <Github size={18} />;
    if (url.includes('mailto:')) return <Mail size={18} />;
    return <Globe size={18} />;
  };

  const getLinkLabel = (url: string) => {
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('github.com')) return 'GitHub';
    if (url.includes('mailto:')) return 'Email';
    return 'Website';
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-section-desktop)', padding: '4rem 0' }}
    >
      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4rem', alignItems: 'start' }}>
        {/* Intro Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <motion.div variants={itemVariants}>
                <h1 style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 1.5rem', lineHeight: 1 }}>
                    Building <span style={{ color: 'var(--accent-primary)' }}>Digital</span> experiences.
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.6 }}>
                   I focus on merging clean logic with intuitive design to build software that feels as good as it works.
                </p>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {developer?.links?.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.3s'
                    }} className="transition-all">
                        {getLinkIcon(url)}
                        {getLinkLabel(url)}
                    </a>
                ))}
            </motion.div>
        </div>

        {/* Profile Details */}
        <motion.div variants={itemVariants} className="card-glass" style={{ padding: '3rem', display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '24px', 
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--emerald-900))',
                    padding: '3px',
                    flexShrink: 0
                }}>
                    <img 
                        src={developer?.profileImageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='96' fill='%2310b981' fill-opacity='.1'/%3E%3Ccircle cx='96' cy='74' r='34' fill='%2310b981'/%3E%3Cpath d='M42 164c8-28 30-42 54-42s46 14 54 42' fill='%2310b981'/%3E%3C/svg%3E"} 
                        alt={developer?.name}
                        style={{ width: '100%', height: '100%', borderRadius: '21px', objectFit: 'cover' }}
                    />
                </div>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{developer?.name || 'Kavin'}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9375rem', fontWeight: 600 }}>
                        <MapPin size={16} />
                        {developer?.city || 'Developer'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', borderTop: '1px solid var(--border-color)', paddingTop: '3rem' }}>
                <div>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
                        My Story
                    </h3>
                    <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                        {developer?.bio || "Crafting tools that solve real problems through elegant code and thoughtful design."}
                    </p>
                </div>

                <div>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
                        Skills
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {developer?.skills?.map((skill, idx) => (
                            <span key={idx} style={{ 
                                padding: '0.5rem 1rem', 
                                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-main)',
                                borderRadius: '8px',
                                fontSize: '0.8125rem',
                                fontWeight: 700
                            }}>
                                {skill}
                            </span>
                        )) || <span style={{ color: 'var(--text-muted)' }}>Learning and building...</span>}
                    </div>
                </div>
            </div>
        </motion.div>
      </section>

      {/* Stats/Portfolio Section */}
      <motion.section variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card-glass" style={{ padding: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0
              }}>
                <Package size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>
                  App Portfolio
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem', fontWeight: 500 }}>
                  <strong>{apps.length}</strong> public projects currently live in the store.
                </p>
              </div>
          </div>
          
          <div className="card-glass" style={{ padding: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  backgroundColor: 'rgba(52, 211, 153, 0.1)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--emerald-400)',
                  flexShrink: 0
              }}>
                <Zap size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>
                    Fast Delivery
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem', fontWeight: 500 }}>
                  Focused on performance and modern tech stacks.
                </p>
              </div>
          </div>
      </motion.section>
    </motion.div>
  );
}

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, Home, Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '70vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '24px', 
          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem'
        }}>
          <AlertCircle size={40} />
        </div>

        <h1 style={{ 
          fontSize: 'clamp(3rem, 8vw, 6rem)', 
          fontWeight: 800, 
          letterSpacing: '-0.05em',
          margin: '0 0 1rem',
          lineHeight: 1
        }}>
          40<span style={{ color: 'var(--accent-primary)' }}>4</span>
        </h1>
        
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          color: 'var(--text-main)',
          marginBottom: '1rem' 
        }}>
          Page Not Found
        </h2>
        
        <p style={{ 
          color: 'var(--text-secondary)', 
          maxWidth: '400px', 
          margin: '0 auto 3rem',
          lineHeight: 1.6,
          fontWeight: 500
        }}>
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '0.875rem 1.5rem', 
            backgroundColor: 'var(--text-main)', 
            color: 'var(--bg-main)', 
            borderRadius: '9999px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.9375rem',
            transition: 'transform 0.2s'
          }}>
            <Home size={18} /> Go Home
          </Link>
          <Link href="/apps" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '0.875rem 1.5rem', 
            backgroundColor: 'var(--bg-secondary)', 
            color: 'var(--text-main)', 
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.9375rem'
          }}>
            <Package size={18} /> Browse Apps
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

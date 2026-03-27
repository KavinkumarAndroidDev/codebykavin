'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  appId: string;
  onRate: (rating: number) => Promise<boolean>;
}

export default function StarRating({ appId, onRate }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [rated, setRated] = useState(false);

  // Initial check for localStorage
  useState(() => {
    if (typeof window !== 'undefined') {
      const ratedApps = JSON.parse(localStorage.getItem('ratedApps') || '{}');
      if (ratedApps[appId]) setRated(true);
    }
  });

  const handleRate = async (rating: number) => {
    if (rated || submitting) return;
    setSubmitting(true);
    const success = await onRate(rating);
    if (success) {
      setRated(true);
    }
    setSubmitting(false);
  };

  if (rated) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
        <p style={{ margin: 0, fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>Rating Recorded. Thank you!</p>
      </div>
    );
  }

  return (
    <div className="card-glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Rate this creation</h4>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: submitting ? 'default' : 'pointer',
              color: (hover || 0) >= star ? 'var(--accent-primary)' : 'var(--text-muted)',
              transition: 'color 0.2s'
            }}
          >
            <Star size={32} fill={(hover || 0) >= star ? 'currentColor' : 'none'} />
          </motion.button>
        ))}
      </div>
      {submitting && <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitting to Firebase...</p>}
    </div>
  );
}

import { Metadata } from 'next';
import { Suspense } from 'react';
import AppsClient from './AppsClient';

export const metadata: Metadata = {
  title: 'The App Store',
  description: 'Explore the complete collection of CodeByKavin software. Productivity, fun, and experimental apps in one place.',
};

export default function AppsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loader" />
        <p className="mono" style={{ color: 'var(--text-muted)', marginTop: '1.5rem' }}>Loading Store...</p>
      </div>
    }>
      <AppsClient />
    </Suspense>
  );
}

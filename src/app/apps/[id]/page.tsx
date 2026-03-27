import { Metadata } from 'next';
import { Suspense } from 'react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db, legacyAppId } from '@/lib/firebase';
import AppDetailClient from './AppDetailClient';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const appId = params.id;
  try {
    const docRef = doc(db, `artifacts/${legacyAppId}/public/data/apps`, appId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const app = snap.data();
      return {
        title: app.name,
        description: app.tagline || app.description?.substring(0, 160),
        openGraph: {
          title: app.name,
          description: app.tagline,
          images: app.screenshots && app.screenshots.length > 0 ? [app.screenshots[0]] : [],
        }
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: 'App Details',
    description: 'Explore this creative creation on CodeByKavin.',
  };
}

export default function AppDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loader" />
        <p className="mono" style={{ color: 'var(--text-muted)', marginTop: '1.5rem' }}>Loading...</p>
      </div>
    }>
      <AppDetailClient />
    </Suspense>
  );
}

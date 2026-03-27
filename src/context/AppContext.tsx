'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, doc, onSnapshot, orderBy, query, Timestamp, runTransaction, getDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth, legacyAppId } from '../lib/firebase';

export interface AppCategory {
  id: string;
}

export interface AppData {
  id: string;
  name: string;
  version: string;
  tagline: string;
  description: string;
  downloads: number;
  icon: string;
  rating: number;
  ratingCount?: number;
  ratingSum?: number;
  releaseDate?: Timestamp;
  categoryName: string;
  categoryId: string;
  screenshots: string[];
  apkUrl?: string;
  playStoreUrl?: string;
}

export interface DeveloperProfile {
  name: string;
  bio?: string;
  city?: string;
  profileImageUrl?: string;
  links?: string[];
  skills?: string[];
  featuredAppId: string;
}

interface AppContextType {
  apps: AppData[];
  developer: DeveloperProfile | null;
  loading: boolean;
  incrementDownloads: (appId: string) => Promise<void>;
  submitAppRating: (appId: string, rating: number) => Promise<boolean>;
}

export const AppContext = createContext<AppContextType>({
  apps: [],
  developer: null,
  loading: true,
  incrementDownloads: async () => {},
  submitAppRating: async () => false,
});

const getDisplayCategoryDetails = (categoryId: string) => {
  switch (categoryId.toLowerCase()) {
      case 'productivity': return { name: 'Productivity', icon: 'calendar-check' };
      case 'games': return { name: 'Fun', icon: 'gamepad-2' };
      case 'tools': return { name: 'Tools', icon: 'wrench' };
      case 'experiments': return { name: 'Experiments', icon: 'flask-conical' };
      case 'misc': return { name: 'Misc', icon: 'layout-grid' };
      default: return { name: categoryId, icon: 'layout-grid' };
  }
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [apps, setApps] = useState<AppData[]>([]);
  const [developer, setDeveloper] = useState<DeveloperProfile | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingDeveloper, setLoadingDeveloper] = useState(true);

  useEffect(() => {
    // 1. Ensure authenticated anonymously for Firestore rules access
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch(err => console.error("Anonymous auth failed", err));
      }
    });

    // 2. Fetch the Data
    const APP_DATA_PATH = `artifacts/${legacyAppId}/public/data/apps`;
    const DEVELOPER_PROFILE_PATH = `artifacts/${legacyAppId}/public/data/developerProfile/profile`;

    const appsQuery = query(collection(db, APP_DATA_PATH), orderBy('releaseDate', 'desc'));
    
    const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
      const fetchedApps = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          categoryName: data.category ? getDisplayCategoryDetails(data.category.id).name : 'N/A',
          categoryId: data.category ? data.category.id : 'N/A',
          screenshots: Array.isArray(data.screenshots) ? data.screenshots.filter(Boolean) : []
        } as AppData;
      });
      setApps(fetchedApps);
      setLoadingApps(false);
    }, (error) => {
      console.error("Error fetching apps", error);
      setLoadingApps(false);
    });

    const unsubscribeDev = onSnapshot(doc(db, DEVELOPER_PROFILE_PATH), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setDeveloper(docSnapshot.data() as DeveloperProfile);
      }
      setLoadingDeveloper(false);
    }, (error) => {
      console.error("Error fetching dev profile", error);
      setLoadingDeveloper(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeApps();
      unsubscribeDev();
    };
  }, []);

  const incrementDownloads = useCallback(async (appId: string) => {
    const appRef = doc(db, `artifacts/${legacyAppId}/public/data/apps/${appId}`);
    try {
      await runTransaction(db, async (transaction) => {
        const appDoc = await transaction.get(appRef);
        if (appDoc.exists()) {
          const newDownloads = (appDoc.data().downloads || 0) + 1;
          transaction.update(appRef, { downloads: newDownloads });
        }
      });
    } catch (e) {
      console.error("Error incrementing downloads", e);
    }
  }, []);

  const submitAppRating = useCallback(async (appId: string, rating: number) => {
    const ratedApps = JSON.parse(localStorage.getItem('ratedApps') || '{}');
    if (ratedApps[appId]) return false;

    const appRef = doc(db, `artifacts/${legacyAppId}/public/data/apps/${appId}`);
    try {
      await runTransaction(db, async (transaction) => {
        const appDoc = await transaction.get(appRef);
        if (!appDoc.exists()) return;
        
        const data = appDoc.data();
        const newCount = (data.ratingCount || 0) + 1;
        const newSum = (data.ratingSum || 0) + rating;
        const newAvg = newSum / newCount;

        transaction.update(appRef, {
            ratingCount: newCount,
            ratingSum: newSum,
            rating: newAvg
        });
      });
      
      ratedApps[appId] = true;
      localStorage.setItem('ratedApps', JSON.stringify(ratedApps));
      return true;
    } catch (e) {
      console.error("Error submitting rating", e);
      return false;
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
        apps, 
        developer, 
        loading: loadingApps || loadingDeveloper,
        incrementDownloads,
        submitAppRating
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = () => useContext(AppContext);

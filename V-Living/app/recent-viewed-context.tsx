import React, { createContext, useContext, useState, useCallback } from 'react';
import { LandlordPostItem } from '../apis/posts';

interface RecentViewedContextType {
  recentViewed: LandlordPostItem[];
  addToRecentViewed: (post: LandlordPostItem) => void;
  clearRecentViewed: () => void;
}

const RecentViewedContext = createContext<RecentViewedContextType | undefined>(undefined);

export function RecentViewedProvider({ children }: { children: React.ReactNode }) {
  const [recentViewed, setRecentViewed] = useState<LandlordPostItem[]>([]);

  const addToRecentViewed = useCallback((post: LandlordPostItem) => {
    setRecentViewed(prev => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter(p => p.postId !== post.postId);
      // Add to beginning and limit to 10 items
      return [post, ...filtered].slice(0, 10);
    });
  }, []);

  const clearRecentViewed = useCallback(() => {
    setRecentViewed([]);
  }, []);

  return (
    <RecentViewedContext.Provider value={{ 
      recentViewed, 
      addToRecentViewed, 
      clearRecentViewed 
    }}>
      {children}
    </RecentViewedContext.Provider>
  );
}

export function useRecentViewed() {
  const context = useContext(RecentViewedContext);
  if (context === undefined) {
    throw new Error('useRecentViewed must be used within a RecentViewedProvider');
  }
  return context;
}

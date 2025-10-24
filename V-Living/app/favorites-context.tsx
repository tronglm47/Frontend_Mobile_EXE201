import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FavoritesContextValue = {
  favorites: Set<string>;
  toggle: (id: string) => void;
  isFav: (id: string) => boolean;
};

const FavoritesContext = React.createContext<FavoritesContextValue | undefined>(undefined);

const STORAGE_KEY = 'favorites_ids_v1';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setFavorites(new Set(JSON.parse(raw)));
      } catch {}
    })();
  }, []);

  const persist = React.useCallback(async (next: Set<string>) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))); } catch {}
  }, []);

  const toggle = React.useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      persist(next);
      return next;
    });
  }, [persist]);

  const isFav = React.useCallback((id: string) => favorites.has(id), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFav }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = React.useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

// Default export để tránh warning
export default FavoritesProvider;

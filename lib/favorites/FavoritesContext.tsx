'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getMyFavoriteSlugs, toggleFavorite } from '@/app/favorites-actions';

type FavoritesState = {
  slugs: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setSlugs([]);
      return;
    }
    getMyFavoriteSlugs().then(setSlugs);
  }, [user]);

  const toggle = useCallback(
    (id: string) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      // optimistic
      setSlugs((cur) =>
        cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
      );
      toggleFavorite(id).then((res) => {
        if (res.status === 'auth') router.push('/auth');
      });
    },
    [user, router]
  );

  const value = useMemo<FavoritesState>(
    () => ({ slugs, has: (id) => slugs.includes(id), toggle }),
    [slugs, toggle]
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within <FavoritesProvider>');
  return ctx;
}

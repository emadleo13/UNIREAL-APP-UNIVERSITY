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
import {
  getMyFavoriteSlugs,
  importGuestFavorites,
  toggleFavorite,
} from '@/app/favorites-actions';
import { GUEST_FAVORITES_LIMIT } from '@/lib/limits';
import { FavoriteGateModal } from '@/components/university/FavoriteGateModal';

export type FavoriteGate = 'signup' | 'pro' | null;

type FavoritesState = {
  slugs: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
};

const GUEST_KEY = 'unireal.guestFavorites';
const FavoritesContext = createContext<FavoritesState | null>(null);

function readGuestSlugs(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function writeGuestSlugs(slugs: string[]) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(slugs));
  } catch {
    /* ignore */
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [gate, setGate] = useState<FavoriteGate>(null);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      // Guest mode: favorites live in localStorage (up to GUEST_FAVORITES_LIMIT).
      setSlugs(readGuestSlugs());
      return;
    }

    // Signed in: merge anything saved as a guest into the account, then load.
    (async () => {
      const guest = readGuestSlugs();
      if (guest.length > 0) {
        const merged = await importGuestFavorites(guest);
        try {
          localStorage.removeItem(GUEST_KEY);
        } catch {
          /* ignore */
        }
        if (!cancelled && merged.length > 0) {
          setSlugs(merged);
          return;
        }
      }
      const mine = await getMyFavoriteSlugs();
      if (!cancelled) setSlugs(mine);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    (id: string) => {
      if (!user) {
        setSlugs((cur) => {
          if (cur.includes(id)) {
            const next = cur.filter((s) => s !== id);
            writeGuestSlugs(next);
            return next;
          }
          if (cur.length >= GUEST_FAVORITES_LIMIT) {
            setGate('signup');
            return cur;
          }
          const next = [...cur, id];
          writeGuestSlugs(next);
          return next;
        });
        return;
      }
      // optimistic
      setSlugs((cur) =>
        cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
      );
      toggleFavorite(id).then((res) => {
        if (res.status === 'auth') router.push('/auth');
        if (res.status === 'limit') {
          // revert the optimistic add and offer Pro
          setSlugs((cur) => cur.filter((s) => s !== id));
          setGate('pro');
        }
      });
    },
    [user, router]
  );

  const value = useMemo<FavoritesState>(
    () => ({ slugs, has: (id) => slugs.includes(id), toggle }),
    [slugs, toggle]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <FavoriteGateModal gate={gate} onClose={() => setGate(null)} />
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within <FavoritesProvider>');
  return ctx;
}

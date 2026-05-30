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
import type { User } from '@/lib/data/types';

/**
 * Mock auth provider — DEMO ONLY. Persists a fake user in localStorage so the
 * review/Q&A forms behave realistically (including the Verified badge, which is
 * derived from the email domain at submit time).
 * TODO(supabase): replace with Supabase Auth (email + Google OAuth).
 */
type AuthState = {
  user: User | null;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
};

const STORAGE_KEY = 'unireal.mockUser';
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const signIn = useCallback((email: string, name?: string) => {
    const next: User = {
      id: `user_${email.toLowerCase()}`,
      email: email.trim(),
      name: name?.trim() || email.split('@')[0],
      verifiedDomains: [],
    };
    setUser(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

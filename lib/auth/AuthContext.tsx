'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/lib/data/types';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Dual-mode auth.
 *  - When Supabase env is set → real Supabase Auth (email/password + Google).
 *  - Otherwise → the original localStorage mock, so the demo keeps working.
 * Components only depend on `user` / `signOut`, so both modes are drop-in.
 */
type Result = { error?: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<Result>;
  signUp: (email: string, password: string, name?: string) => Promise<Result>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = 'unireal.mockUser';
const AuthContext = createContext<AuthState | null>(null);

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapSupabaseUser(u: any): User {
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    email: u.email ?? '',
    name: meta.name || meta.full_name || (u.email ? u.email.split('@')[0] : ''),
    verifiedDomains: [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(
    null
  );
  if (configured && !supabaseRef.current) {
    supabaseRef.current = createSupabaseBrowserClient();
  }

  // ── Real Supabase mode ──────────────────────────────────────────────────
  useEffect(() => {
    if (!configured) return;
    const supabase = supabaseRef.current!;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? mapSupabaseUser(data.user) : null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  // ── Mock mode bootstrap ─────────────────────────────────────────────────
  useEffect(() => {
    if (configured) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [configured]);

  const mockSignIn = useCallback((email: string, name?: string): Result => {
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
    return {};
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<Result> => {
      if (!configured) return mockSignIn(email);
      const { error } = await supabaseRef.current!.auth.signInWithPassword({
        email,
        password,
      });
      return error ? { error: error.message } : {};
    },
    [configured, mockSignIn]
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string): Promise<Result> => {
      if (!configured) return mockSignIn(email, name);
      const { error } = await supabaseRef.current!.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      return error ? { error: error.message } : {};
    },
    [configured, mockSignIn]
  );

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      mockSignIn('google.user@example.com', 'Google User');
      return;
    }
    await supabaseRef.current!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, [configured, mockSignIn]);

  const signOut = useCallback(async () => {
    if (configured) {
      await supabaseRef.current!.auth.signOut();
      setUser(null);
      return;
    }
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [configured]);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      signInWithPassword,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, configured, signInWithPassword, signUp, signInWithGoogle, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Tiny cross-component store for the "compare" selection, persisted in
 * localStorage so it survives navigation and reloads. Backed by
 * useSyncExternalStore so every CompareButton and the CompareBar stay in sync.
 */
const KEY = 'unireal.compare';
export const MAX_COMPARE = 4;

const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] = EMPTY;
let cacheRaw = '';

function readRaw(): string {
  if (typeof localStorage === 'undefined') return '[]';
  return localStorage.getItem(KEY) ?? '[]';
}

function getSnapshot(): string[] {
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = JSON.parse(raw);
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function write(next: string[]) {
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== 'undefined') window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== 'undefined') window.removeEventListener('storage', cb);
  };
}

export function useCompare() {
  const slugs = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const toggle = useCallback((slug: string) => {
    const cur = getSnapshot();
    if (cur.includes(slug)) {
      write(cur.filter((s) => s !== slug));
    } else if (cur.length < MAX_COMPARE) {
      write([...cur, slug]);
    }
  }, []);

  const clear = useCallback(() => write([]), []);

  return {
    slugs,
    has: (slug: string) => slugs.includes(slug),
    full: slugs.length >= MAX_COMPARE,
    toggle,
    clear,
  };
}

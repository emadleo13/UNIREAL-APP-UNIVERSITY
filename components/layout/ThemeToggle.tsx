'use client';

import { useEffect, useState } from 'react';

/** Light/dark toggle. Persists to localStorage; respects system on first visit. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('unireal.theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-lg border border-border p-1.5 text-foreground hover:bg-accent"
    >
      {dark ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm5.66 2.34a1 1 0 010 1.42l-.7.7a1 1 0 11-1.42-1.42l.7-.7a1 1 0 011.42 0zM18 9a1 1 0 110 2h-1a1 1 0 110-2h1zM5.46 5.46a1 1 0 00-1.42 0l-.7.7a1 1 0 101.42 1.42l.7-.7a1 1 0 000-1.42zM3 9a1 1 0 100 2H2a1 1 0 100-2h1zm7 4a3 3 0 100-6 3 3 0 000 6zm0 2a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm5.66-.34a1 1 0 00-1.42-1.42l-.7.7a1 1 0 101.42 1.42l.7-.7z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

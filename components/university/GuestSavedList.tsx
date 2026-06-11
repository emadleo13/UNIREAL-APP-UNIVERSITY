'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { UniversityCard } from '@/components/university/UniversityCard';
import { getUniversitiesBySlugs } from '@/app/favorites-actions';
import type { University } from '@/lib/data/types';

/**
 * Saved page for signed-out visitors: shows the (up to GUEST_FAVORITES_LIMIT)
 * universities kept in localStorage, plus the create-account nudge that
 * unlocks a bigger list and deadline-reminder emails.
 */
export function GuestSavedList() {
  const t = useTranslations('Favorites');
  const [unis, setUnis] = useState<University[] | null>(null);

  useEffect(() => {
    let slugs: string[] = [];
    try {
      const raw = localStorage.getItem('unireal.guestFavorites');
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) slugs = parsed.filter((s) => typeof s === 'string');
    } catch {
      /* ignore */
    }
    if (slugs.length === 0) {
      setUnis([]);
      return;
    }
    getUniversitiesBySlugs(slugs).then(setUnis);
  }, []);

  if (unis === null) return null;

  if (unis.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('signInPrompt')}</p>
        <Link
          href="/auth"
          className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {t('signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('guestSavedNote')}{' '}
        <Link href="/auth" className="font-medium text-primary hover:opacity-80">
          {t('signIn')}
        </Link>
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {unis.map((u) => (
          <UniversityCard key={u.id} university={u} />
        ))}
      </div>
    </div>
  );
}

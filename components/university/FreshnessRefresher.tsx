'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { refreshUniversityIfStale } from '@/app/university-actions';

/**
 * Fires the on-view freshness refresh once after the page renders. Renders
 * nothing. If the server refreshed the record, refresh the route to show it.
 */
export function FreshnessRefresher({ slug }: { slug: string }) {
  const locale = useLocale();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    refreshUniversityIfStale(slug, locale)
      .then((res) => {
        if (res.refreshed) router.refresh();
      })
      .catch(() => {});
  }, [slug, locale, router]);

  return null;
}

'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { useCompare } from '@/lib/compare/useCompare';

export function CompareBar() {
  const t = useTranslations('Compare');
  const { slugs, clear } = useCompare();

  if (slugs.length === 0) return null;

  return (
    <div className="fixed bottom-24 z-30 ltr:left-4 rtl:right-4 sm:bottom-6">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-theme">
        <span className="text-sm font-medium text-foreground">
          {t('barLabel', { count: slugs.length })}
        </span>
        <Link
          href={`/compare?ids=${slugs.join(',')}`}
          className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {t('view')}
        </Link>
        <button
          type="button"
          onClick={clear}
          className="text-sm text-muted-foreground hover:text-foreground"
          aria-label={t('clear')}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useCompare } from '@/lib/compare/useCompare';

export function CompareButton({ slug }: { slug: string }) {
  const t = useTranslations('Compare');
  const { has, full, toggle } = useCompare();
  const active = has(slug);
  const disabled = !active && full;

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={disabled}
      aria-pressed={active}
      title={disabled ? t('full') : undefined}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
      }`}
    >
      {active ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )}
      {active ? t('added') : t('compare')}
    </button>
  );
}

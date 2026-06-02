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
      className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
      }`}
    >
      {active ? `✓ ${t('added')}` : `+ ${t('compare')}`}
    </button>
  );
}

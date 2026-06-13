'use client';

import { useTranslations } from 'next-intl';
import { useFavorites } from '@/lib/favorites/FavoritesContext';

export function FavoriteButton({
  slug,
  size = 18,
}: {
  slug: string;
  size?: number;
}) {
  const t = useTranslations('Favorites');
  const { has, toggle } = useFavorites();
  const active = has(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={active}
      aria-label={active ? t('remove') : t('save')}
      title={active ? t('remove') : t('save')}
      className={`inline-flex items-center justify-center rounded-full p-2.5 transition-colors ${
        active
          ? 'text-rose-500'
          : 'text-muted-foreground hover:text-rose-500'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}

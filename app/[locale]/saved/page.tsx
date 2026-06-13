import { getTranslations, setRequestLocale } from 'next-intl/server';
import { UniversityCard } from '@/components/university/UniversityCard';
import { GuestSavedList } from '@/components/university/GuestSavedList';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCurrentUser } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getMyFavorites } from '@/app/favorites-actions';

export const dynamic = 'force-dynamic';

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Favorites');

  const user = isSupabaseConfigured() ? await getCurrentUser() : null;

  // Guests see whatever they saved on this device (localStorage) plus the
  // create-account nudge that unlocks more saves and deadline reminders.
  if (!user) return <GuestSavedList />;

  const unis = await getMyFavorites();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      {unis.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .81-4.5 2.09C10.5 3.81 9.26 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
            </svg>
          }
          title={t('empty')}
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unis.map((u) => (
            <UniversityCard key={u.id} university={u} />
          ))}
        </div>
      )}
    </div>
  );
}

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { UniversityCard } from '@/components/university/UniversityCard';
import { GuestSavedList } from '@/components/university/GuestSavedList';
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
        <p className="mt-4 text-muted-foreground">{t('empty')}</p>
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

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { UniversityCard } from '@/components/university/UniversityCard';
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

  if (!user) {
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

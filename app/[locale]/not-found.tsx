import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('Nav');
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        {t('home')}
      </Link>
    </div>
  );
}

import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('Nav');
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t('home')}
      </Link>
    </div>
  );
}

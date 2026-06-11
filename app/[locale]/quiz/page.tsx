import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { QuizForm } from '@/components/quiz/QuizForm';
import { SITE_URL, localeAlternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Quiz' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates('/quiz', locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}/quiz`,
      siteName: 'UNIREAL',
    },
  };
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Quiz');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          UNIREAL
        </Link>
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t('subtitle')}</p>

      <QuizForm />
    </div>
  );
}

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UniversityCard } from '@/components/university/UniversityCard';
import { SubscribeButton } from '@/components/billing/SubscribeButton';
import { repo } from '@/lib/data';
import { EASTERN_EUROPE_COUNTRIES } from '@/lib/data/regions';
import { STUDY_COUNTRIES, countryName } from '@/lib/data/countries';
import { SITE_URL, localeAlternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Seo' });
  const title = t('homeTitle');
  const description = t('homeDescription');
  return {
    // homeTitle already carries the brand, so skip the "· UNIREAL" template.
    title: { absolute: title },
    description,
    alternates: localeAlternates('', locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      siteName: 'UNIREAL',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');
  const tStudy = await getTranslations('StudyIn');

  // Homepage focuses on Eastern-European universities.
  const { items: featured } = await repo.listUniversities({
    countries: EASTERN_EUROPE_COUNTRIES,
    page: 1,
    pageSize: 6,
  });

  const features = [
    { title: t('feature1Title'), body: t('feature1Body') },
    { title: t('feature2Title'), body: t('feature2Body') },
    { title: t('feature3Title'), body: t('feature3Body') },
  ];

  return (
    <div>
      <section className="bg-gradient-to-b from-accent to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-unireal.png"
            alt=""
            className="mx-auto mb-6 h-24 w-24 rounded-2xl object-contain shadow-theme dark:bg-white dark:p-2"
          />
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/universities">
              <Button size="lg">{t('ctaExplore')}</Button>
            </Link>
            <Link href="/universities">
              <Button size="lg" variant="secondary">
                {t('ctaAsk')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold text-foreground">{t('featuresTitle')}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-5">
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-accent to-card p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-foreground">
                {t('subscribeTitle')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t('subscribeBody')}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>✓ {t('subscribePerk1')}</li>
                <li>✓ {t('subscribePerk2')}</li>
                <li>✓ {t('subscribePerk3')}</li>
              </ul>
            </div>
            <div className="flex-none">
              <SubscribeButton label={t('subscribeCta')} />
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((u) => (
            <UniversityCard key={u.id} university={u} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-xl font-bold text-foreground">
          {tStudy('otherDestinations')}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {STUDY_COUNTRIES.map((c) => (
            <Link
              key={c.slug}
              href={`/study-in/${c.slug}`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {countryName(c, locale)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

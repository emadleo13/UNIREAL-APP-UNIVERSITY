import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { STUDY_COUNTRIES, countryName } from '@/lib/data/countries';
import { SCHOLARSHIPS, scholarshipSummary } from '@/lib/data/scholarships';
import { SITE_URL, localeAlternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Scholarships' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates('/scholarships', locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}/scholarships`,
      siteName: 'UNIREAL',
    },
  };
}

export default async function ScholarshipsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Scholarships');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: SCHOLARSHIPS.length,
    itemListElement: SCHOLARSHIPS.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      url: s.url,
    })),
  };

  const countryLabel = (slugs: string[]) =>
    slugs
      .map((slug) => {
        const c = STUDY_COUNTRIES.find((x) => x.slug === slug);
        return c ? countryName(c, locale) : slug;
      })
      .join(' · ');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          UNIREAL
        </Link>
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-8 space-y-4">
        {SCHOLARSHIPS.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-foreground">{s.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.provider}</p>
              </div>
              <Badge tone={s.countrySlugs.length === 0 ? 'green' : 'muted'}>
                {s.countrySlugs.length === 0
                  ? t('regionWide')
                  : countryLabel(s.countrySlugs)}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {scholarshipSummary(s, locale)}
            </p>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-primary hover:opacity-80"
            >
              {t('official')} ↗
            </a>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">{t('disclaimer')}</p>

      <h2 className="mt-10 text-lg font-bold text-foreground">{t('browseTitle')}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {STUDY_COUNTRIES.map((c) => (
          <Link
            key={c.slug}
            href={`/study-in/${c.slug}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            {countryName(c, locale)}
          </Link>
        ))}
      </div>
    </div>
  );
}

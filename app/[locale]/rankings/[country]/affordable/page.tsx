import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { RankedList } from '@/components/university/RankedList';
import { repo } from '@/lib/data';
import { findStudyCountry, countryName } from '@/lib/data/countries';
import { universityName } from '@/lib/data/display';
import { SITE_URL, localeAlternates } from '@/lib/seo';

export const revalidate = 86400;

const LIST_SIZE = 10;

async function load(countrySlug: string) {
  const country = findStudyCountry(countrySlug);
  if (!country) return null;
  const { items } = await repo.listUniversities({
    countries: country.match,
    sort: 'tuition',
    pageSize: 100,
  });
  // Only universities with known tuition belong on a "cheapest" list.
  const withTuition = items.filter((u) => u.tuition != null).slice(0, LIST_SIZE);
  return { country, items: withTuition };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country: countrySlug } = await params;
  const data = await load(countrySlug);
  if (!data) return {};
  const t = await getTranslations({ locale, namespace: 'Rankings' });
  const name = countryName(data.country, locale);
  const title = t('cheapestMetaTitle', { country: name });
  const description = t('cheapestMetaDescription', { country: name });
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates(`/rankings/${countrySlug}/affordable`, locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}/rankings/${countrySlug}/affordable`,
      siteName: 'UNIREAL',
    },
  };
}

export default async function AffordableUniversitiesPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country: countrySlug } = await params;
  setRequestLocale(locale);
  const data = await load(countrySlug);
  if (!data || data.items.length === 0) notFound();
  const { country, items } = data;
  const t = await getTranslations('Rankings');
  const tStudy = await getTranslations('StudyIn');
  const name = countryName(country, locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'UNIREAL', item: `${SITE_URL}/${locale}` },
          {
            '@type': 'ListItem',
            position: 2,
            name: tStudy('heroTitle', { country: name }),
            item: `${SITE_URL}/${locale}/study-in/${countrySlug}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: t('cheapestTitle', { country: name }),
            item: `${SITE_URL}/${locale}/rankings/${countrySlug}/affordable`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.map((uni, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/${locale}/universities/${uni.slug}`,
          name: universityName(uni, locale),
        })),
      },
    ],
  };

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
        <span className="px-1">/</span>
        <Link href={`/study-in/${countrySlug}`} className="hover:text-primary">
          {tStudy('heroTitle', { country: name })}
        </Link>
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-foreground">
        {t('cheapestTitle', { country: name })}
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t('cheapestIntro')}</p>

      <RankedList
        items={items}
        locale={locale}
        tuitionLabel={t('perYear')}
        scoreLabel={t('scoreShort')}
      />

      <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium">
        <Link href={`/rankings/${countrySlug}`} className="text-primary hover:opacity-80">
          {t('seeAlsoBest', { country: name })} →
        </Link>
        <Link href={`/study-in/${countrySlug}`} className="text-primary hover:opacity-80">
          {tStudy('heroTitle', { country: name })} →
        </Link>
        <Link href="/scholarships" className="text-primary hover:opacity-80">
          {t('seeAlsoScholarships')} →
        </Link>
      </div>
    </div>
  );
}

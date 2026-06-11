import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { UniversityCard } from '@/components/university/UniversityCard';
import { repo } from '@/lib/data';
import {
  STUDY_COUNTRIES,
  findStudyCountry,
  countryName,
} from '@/lib/data/countries';
import {
  STUDY_FIELDS,
  findStudyField,
  fieldName,
  universityMatchesField,
} from '@/lib/data/fields';
import { universityName } from '@/lib/data/display';
import { SITE_URL, localeAlternates } from '@/lib/seo';

export const revalidate = 86400;

async function load(fieldSlug: string, countrySlug: string) {
  const field = findStudyField(fieldSlug);
  const country = findStudyCountry(countrySlug);
  if (!field || !country) return null;
  const { items } = await repo.listUniversities({
    countries: country.match,
    sort: 'score',
    pageSize: 500,
  });
  const matches = items.filter((u) => universityMatchesField(u, field));
  return { field, country, matches };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; field: string; country: string }>;
}): Promise<Metadata> {
  const { locale, field: fieldSlug, country: countrySlug } = await params;
  const data = await load(fieldSlug, countrySlug);
  if (!data) return {};
  const t = await getTranslations({ locale, namespace: 'Fields' });
  const fName = fieldName(data.field, locale);
  const cName = countryName(data.country, locale);
  const title = t('metaCountryTitle', { field: fName, country: cName });
  const description = t('metaCountryDescription', {
    field: fName,
    country: cName,
    count: data.matches.length,
  });
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates(`/fields/${fieldSlug}/${countrySlug}`, locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}/fields/${fieldSlug}/${countrySlug}`,
      siteName: 'UNIREAL',
    },
  };
}

export default async function FieldCountryPage({
  params,
}: {
  params: Promise<{ locale: string; field: string; country: string }>;
}) {
  const { locale, field: fieldSlug, country: countrySlug } = await params;
  setRequestLocale(locale);
  const data = await load(fieldSlug, countrySlug);
  if (!data) notFound();
  const { field, country, matches } = data;
  const t = await getTranslations('Fields');
  const tStudy = await getTranslations('StudyIn');
  const fName = fieldName(field, locale);
  const cName = countryName(country, locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'UNIREAL', item: `${SITE_URL}/${locale}` },
          { '@type': 'ListItem', position: 2, name: t('indexTitle'), item: `${SITE_URL}/${locale}/fields` },
          { '@type': 'ListItem', position: 3, name: fName, item: `${SITE_URL}/${locale}/fields/${fieldSlug}` },
          {
            '@type': 'ListItem',
            position: 4,
            name: t('countryTitle', { field: fName, country: cName }),
            item: `${SITE_URL}/${locale}/fields/${fieldSlug}/${countrySlug}`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        numberOfItems: matches.length,
        itemListElement: matches.slice(0, 50).map((uni, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/${locale}/universities/${uni.slug}`,
          name: universityName(uni, locale),
        })),
      },
    ],
  };

  // Cross-links: same field in other countries (only where data exists is
  // unknown here, so link all), and other fields in this country.
  const otherCountries = STUDY_COUNTRIES.filter((c) => c.slug !== countrySlug);
  const otherFields = STUDY_FIELDS.filter((f) => f.slug !== fieldSlug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          UNIREAL
        </Link>
        <span>/</span>
        <Link href="/fields" className="hover:text-primary">
          {t('indexTitle')}
        </Link>
        <span>/</span>
        <Link href={`/fields/${fieldSlug}`} className="hover:text-primary">
          {fName}
        </Link>
        <span>/</span>
        <span className="text-foreground">{cName}</span>
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-foreground">
        {t('countryTitle', { field: fName, country: cName })}
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        {t('countrySubtitle', { field: fName, country: cName, count: matches.length })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={`/study-in/${countrySlug}`}
          className="font-medium text-primary hover:opacity-80"
        >
          {tStudy('heroTitle', { country: cName })} →
        </Link>
      </div>

      {matches.length === 0 ? (
        <Card className="mt-6 p-5 text-sm text-muted-foreground">
          {t('emptyCountry')}
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {matches.map((uni) => (
            <UniversityCard key={uni.id} university={uni} />
          ))}
        </div>
      )}

      <h2 className="mt-12 text-lg font-bold text-foreground">
        {t('otherCountries', { field: fName })}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {otherCountries.map((c) => (
          <Link
            key={c.slug}
            href={`/fields/${fieldSlug}/${c.slug}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            {countryName(c, locale)}
          </Link>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold text-foreground">
        {t('otherFields', { country: cName })}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {otherFields.map((f) => (
          <Link
            key={f.slug}
            href={`/fields/${f.slug}/${countrySlug}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            {fieldName(f, locale)}
          </Link>
        ))}
      </div>
    </div>
  );
}

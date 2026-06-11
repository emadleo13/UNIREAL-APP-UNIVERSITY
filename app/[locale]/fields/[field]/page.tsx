import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { UniversityCard } from '@/components/university/UniversityCard';
import { repo } from '@/lib/data';
import { STUDY_COUNTRIES, countryName } from '@/lib/data/countries';
import {
  STUDY_FIELDS,
  findStudyField,
  fieldName,
  universityMatchesField,
} from '@/lib/data/fields';
import { universityName } from '@/lib/data/display';
import { SITE_URL, localeAlternates } from '@/lib/seo';

export const revalidate = 86400;

const ALL_COUNTRY_VALUES = STUDY_COUNTRIES.flatMap((c) => c.match);

async function load(fieldSlug: string) {
  const field = findStudyField(fieldSlug);
  if (!field) return null;
  const { items } = await repo.listUniversities({
    countries: ALL_COUNTRY_VALUES,
    sort: 'score',
    pageSize: 1000,
  });
  const matches = items.filter((u) => universityMatchesField(u, field));
  return { field, matches };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; field: string }>;
}): Promise<Metadata> {
  const { locale, field: fieldSlug } = await params;
  const data = await load(fieldSlug);
  if (!data) return {};
  const t = await getTranslations({ locale, namespace: 'Fields' });
  const name = fieldName(data.field, locale);
  const title = t('metaFieldTitle', { field: name });
  const description = t('metaFieldDescription', {
    field: name,
    count: data.matches.length,
  });
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates(`/fields/${fieldSlug}`, locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}/fields/${fieldSlug}`,
      siteName: 'UNIREAL',
    },
  };
}

export default async function FieldPage({
  params,
}: {
  params: Promise<{ locale: string; field: string }>;
}) {
  const { locale, field: fieldSlug } = await params;
  setRequestLocale(locale);
  const data = await load(fieldSlug);
  if (!data) notFound();
  const { field, matches } = data;
  const t = await getTranslations('Fields');
  const name = fieldName(field, locale);

  const byCountry = STUDY_COUNTRIES.map((c) => ({
    country: c,
    count: matches.filter((u) => c.match.includes(u.country)).length,
  })).filter((x) => x.count > 0);

  const top = matches.slice(0, 12);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'UNIREAL', item: `${SITE_URL}/${locale}` },
          { '@type': 'ListItem', position: 2, name: t('indexTitle'), item: `${SITE_URL}/${locale}/fields` },
          { '@type': 'ListItem', position: 3, name, item: `${SITE_URL}/${locale}/fields/${fieldSlug}` },
        ],
      },
      {
        '@type': 'ItemList',
        numberOfItems: matches.length,
        itemListElement: top.map((uni, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/${locale}/universities/${uni.slug}`,
          name: universityName(uni, locale),
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          UNIREAL
        </Link>
        <span className="px-1">/</span>
        <Link href="/fields" className="hover:text-primary">
          {t('indexTitle')}
        </Link>
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-foreground">
        {t('fieldTitle', { field: name })}
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        {t('fieldSubtitle', { field: name, count: matches.length })}
      </p>

      {byCountry.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-bold text-foreground">{t('byCountry')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {byCountry.map(({ country, count }) => (
              <Link
                key={country.slug}
                href={`/fields/${fieldSlug}/${country.slug}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                {countryName(country, locale)}
                <span className="ms-1.5 text-muted-foreground">({count})</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 text-xl font-bold text-foreground">
        {t('topUniversities', { field: name })}
      </h2>
      {top.length === 0 ? (
        <Card className="mt-4 p-5 text-sm text-muted-foreground">
          {t('emptyCountry')}
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {top.map((uni) => (
            <UniversityCard key={uni.id} university={uni} />
          ))}
        </div>
      )}

      <h2 className="mt-12 text-lg font-bold text-foreground">{t('allFieldsLink')}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {STUDY_FIELDS.filter((f) => f.slug !== fieldSlug).map((f) => (
          <Link
            key={f.slug}
            href={`/fields/${f.slug}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            {fieldName(f, locale)}
          </Link>
        ))}
      </div>
    </div>
  );
}

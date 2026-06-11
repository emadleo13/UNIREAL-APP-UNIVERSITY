import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { UniversityCard } from '@/components/university/UniversityCard';
import { repo } from '@/lib/data';
import { universityName } from '@/lib/data/display';
import {
  STUDY_COUNTRIES,
  findStudyCountry,
  countryName,
} from '@/lib/data/countries';
import { STUDY_FIELDS, fieldName } from '@/lib/data/fields';
import { guideForCountry, guideText } from '@/lib/data/country-guides';
import { scholarshipsForCountry, scholarshipSummary } from '@/lib/data/scholarships';
import { SITE_URL, localeAlternates } from '@/lib/seo';
import { locales } from '@/lib/i18n/routing';

// Rebuild daily so new universities / data appear without a redeploy.
export const revalidate = 86400;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    STUDY_COUNTRIES.map((c) => ({ locale, country: c.slug }))
  );
}

async function load(slug: string) {
  const c = findStudyCountry(slug);
  if (!c) return null;
  const { items } = await repo.listUniversities({
    countries: c.match,
    sort: 'score',
    page: 1,
    pageSize: 200,
  });
  return { c, items };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  const data = await load(country);
  if (!data) return {};
  const t = await getTranslations({ locale, namespace: 'StudyIn' });
  const name = countryName(data.c, locale);
  const title = t('metaTitle', { country: name });
  const description = t('metaDescription', {
    country: name,
    count: data.items.length,
  });
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates(`/study-in/${country}`, locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}/study-in/${country}`,
      siteName: 'UNIREAL',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function StudyInCountryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  setRequestLocale(locale);
  const data = await load(country);
  if (!data) notFound();
  const { c, items } = data;
  const t = await getTranslations('StudyIn');
  const name = countryName(c, locale);
  const guide = guideForCountry(c.slug);
  const scholarships = scholarshipsForCountry(c.slug).filter(
    (s) => s.countrySlugs.length > 0
  );

  // Guide sections double as FAQPage rich-result data.
  const guideSections = guide
    ? ([
        { q: t('guideVisaQ', { country: name }), a: guideText(guide, 'visa', locale) },
        { q: t('guideCostsQ', { country: name }), a: guideText(guide, 'livingCosts', locale) },
        { q: t('guideApplicationQ', { country: name }), a: guideText(guide, 'application', locale) },
        { q: t('guideWorkQ', { country: name }), a: guideText(guide, 'work', locale) },
      ] as const)
    : [];

  // ItemList structured data helps Google understand this is a curated list of
  // universities, and BreadcrumbList strengthens the site hierarchy.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      ...(guideSections.length
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: guideSections.map((s) => ({
                '@type': 'Question',
                name: s.q,
                acceptedAnswer: { '@type': 'Answer', text: s.a },
              })),
            },
          ]
        : []),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'UNIREAL',
            item: `${SITE_URL}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: t('heroTitle', { country: name }),
            item: `${SITE_URL}/${locale}/study-in/${country}`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.slice(0, 50).map((uni, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/${locale}/universities/${uni.slug}`,
          name: universityName(uni, locale),
        })),
      },
    ],
  };

  const others = STUDY_COUNTRIES.filter((x) => x.slug !== c.slug);

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
        <Link href="/universities" className="hover:text-primary">
          {t('browseAll')}
        </Link>
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-foreground">
        {t('heroTitle', { country: name })}
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        {t('heroSubtitle', { country: name })}
      </p>

      <Card className="mt-5 border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
        {t('intlNote')}
      </Card>

      <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium">
        <Link
          href={`/rankings/${c.slug}`}
          className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-primary hover:bg-primary/5"
        >
          {t('linkBest', { country: name })}
        </Link>
        <Link
          href={`/rankings/${c.slug}/affordable`}
          className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-primary hover:bg-primary/5"
        >
          {t('linkCheapest', { country: name })}
        </Link>
        <Link
          href="/scholarships"
          className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-primary hover:bg-primary/5"
        >
          {t('linkScholarships')}
        </Link>
        <Link
          href="/quiz"
          className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-primary hover:bg-primary/5"
        >
          {t('linkQuiz')}
        </Link>
      </div>

      {guideSections.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-foreground">
            {t('guideTitle', { country: name })}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {guideSections.map((s) => (
              <Card key={s.q} className="p-5">
                <h3 className="font-semibold text-foreground">{s.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.a}
                </p>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t('guideDisclaimer')}</p>
        </section>
      )}

      {scholarships.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-foreground">
            {t('scholarshipsTitle', { country: name })}
          </h2>
          <div className="mt-4 space-y-3">
            {scholarships.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:opacity-80"
                  >
                    {t('scholarshipOfficial')} ↗
                  </a>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {scholarshipSummary(s, locale)}
                </p>
              </Card>
            ))}
          </div>
          <Link
            href="/scholarships"
            className="mt-3 inline-block text-sm font-medium text-primary hover:opacity-80"
          >
            {t('allScholarships')} →
          </Link>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold text-foreground">
          {t('fieldsHeading', { country: name })}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STUDY_FIELDS.map((f) => (
            <Link
              key={f.slug}
              href={`/fields/${f.slug}/${c.slug}`}
              className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-primary"
            >
              {fieldName(f, locale)}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-foreground">
          {t('listHeading', { country: name })}
        </h2>
        <span className="text-sm text-muted-foreground">
          {t('count', { count: items.length })}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((uni) => (
          <UniversityCard key={uni.id} university={uni} />
        ))}
      </div>

      <h2 className="mt-12 text-lg font-bold text-foreground">
        {t('otherDestinations')}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {others.map((x) => (
          <Link
            key={x.slug}
            href={`/study-in/${x.slug}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            {countryName(x, locale)}
          </Link>
        ))}
      </div>
    </div>
  );
}

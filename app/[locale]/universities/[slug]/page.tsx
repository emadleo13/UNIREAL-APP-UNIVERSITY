import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ReviewSection } from '@/components/university/ReviewSection';
import { QuestionSection } from '@/components/university/QuestionSection';
import { FavoriteButton } from '@/components/university/FavoriteButton';
import { MapCard } from '@/components/university/MapCard';
import { FreshnessRefresher } from '@/components/university/FreshnessRefresher';
import { repo } from '@/lib/data';
import { getEnrichedUniversity } from '@/lib/data/enrich-on-view';
import { universityName, universityDescription } from '@/lib/data/display';
import { computeUniversityScore, type ScoreComponent } from '@/lib/data/score';
import { locales } from '@/lib/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Allow time for the first-view AI enrichment to complete server-side so the
// page is never rendered empty. Subsequent views are instant (cached in the DB).
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const uni = await repo.getUniversityBySlug(slug);
  if (!uni) return {};
  const name = universityName(uni, locale);
  const description = `${name} — ${[uni.city, uni.country]
    .filter(Boolean)
    .join(', ')}. Reviews, Q&A and key facts on UNIREAL.`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}/universities/${slug}`;
  }

  return {
    title: name,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/universities/${slug}`,
      languages,
    },
    openGraph: {
      title: name,
      description,
      type: 'website',
      images: uni.logoUrl ? [{ url: uni.logoUrl }] : undefined,
    },
  };
}

const SCORE_LABEL_KEY: Record<ScoreComponent['key'], string> = {
  ranking: 'scoreRanking',
  research: 'scoreResearch',
  awards: 'scoreAwards',
  medals: 'scoreMedals',
  eliteStudents: 'scoreEliteStudents',
};

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  // First-view enrichment: research + persist before render so the page is
  // never empty. Already-enriched records return immediately.
  const uni = await getEnrichedUniversity(slug);
  if (!uni) notFound();

  const t = await getTranslations('University');
  const name = universityName(uni, locale);
  const description = universityDescription(uni, locale);
  const score = computeUniversityScore(uni);
  const intl = uni.international;
  const [reviews, questions] = await Promise.all([
    repo.listReviews(uni.id),
    repo.listQuestions(uni.id),
  ]);

  const updatedLabel = uni.updatedAt
    ? new Date(uni.updatedAt).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name,
    description,
    url: uni.website,
    logo: uni.logoUrl,
    foundingDate: uni.establishedYear?.toString(),
    sameAs: [
      uni.website,
      uni.wikidataId ? `https://www.wikidata.org/wiki/${uni.wikidataId}` : null,
      uni.rorId,
    ].filter(Boolean),
    address: {
      '@type': 'PostalAddress',
      addressLocality: uni.city,
      addressRegion: uni.region,
      addressCountry: uni.countryCode,
    },
    geo: uni.geo
      ? {
          '@type': 'GeoCoordinates',
          latitude: uni.geo.lat,
          longitude: uni.geo.lng,
        }
      : undefined,
  };

  const facts: Array<{ label: string; value: string | number | undefined }> = [
    { label: t('country'), value: uni.country },
    { label: t('city'), value: uni.city },
    { label: t('established'), value: uni.establishedYear },
    { label: t('students'), value: uni.size?.toLocaleString(locale) },
    { label: t('programs'), value: uni.programsCount?.toLocaleString(locale) },
    {
      label: t('tuition'),
      value: uni.tuition
        ? `${uni.tuitionCurrency === 'USD' ? '$' : '€'}${uni.tuition.toLocaleString(locale)}`
        : undefined,
    },
    {
      label: t('admissionRate'),
      value:
        uni.admissionRate != null
          ? `${Math.round(uni.admissionRate * 100)}%`
          : undefined,
    },
    { label: t('admissionPeriod'), value: uni.admission?.period },
  ];

  const intlFacts: Array<{ label: string; value: string | number | undefined }> =
    intl
      ? [
          { label: t('intlAdmission'), value: intl.admissionPeriod },
          {
            label: t('intlTuition'),
            value: intl.tuition
              ? `$${intl.tuition.toLocaleString(locale)}`
              : undefined,
          },
          {
            label: t('intlPrograms'),
            value: intl.programsCount?.toLocaleString(locale),
          },
          { label: t('intlLanguages'), value: intl.languages?.join(', ') },
        ]
      : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FreshnessRefresher slug={uni.slug} />

      <header className="flex items-start gap-4">
        {uni.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={uni.logoUrl}
            alt=""
            className="h-16 w-16 flex-none rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-accent text-2xl font-bold text-primary">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            <FavoriteButton slug={uni.slug} size={22} />
          </div>
          <p className="mt-1 text-muted-foreground">
            {[uni.city, uni.country].filter(Boolean).join(', ')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {uni.website && (
              <a
                href={uni.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:opacity-80"
              >
                {t('website')} ↗
              </a>
            )}
            {uni.internationalUrl && (
              <a
                href={uni.internationalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:opacity-80"
              >
                {t('intlWebsite')} ↗
              </a>
            )}
          </div>
        </div>
      </header>

      {updatedLabel && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t('updatedAt', { date: updatedLabel })} · {t('freshnessNote')}
        </p>
      )}

      {description && (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-foreground">{t('about')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </Card>
      )}

      {score && (
        <Card className="mt-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{t('unirealScore')}</h2>
            <span className="text-2xl font-bold text-primary">
              {score.total}
              <span className="text-base text-muted-foreground">/100</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t('scoreNote')}</p>
          <dl className="mt-4 space-y-2.5">
            {score.components.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground">
                    {t(SCORE_LABEL_KEY[c.key])}
                  </dt>
                  <dd className="font-medium text-foreground">
                    {Math.round(c.value)}
                  </dd>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round(c.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <Card className="mt-6 p-5">
        <h2 className="sr-only">{t('overviewTab')}</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {facts
            .filter((f) => f.value !== undefined && f.value !== '')
            .map((f) => (
              <div key={f.label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="mt-0.5 font-medium text-foreground">{f.value}</dd>
              </div>
            ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">{t('sources')}:</span>
          {uni.source.map((s) => (
            <Badge key={s} tone="muted">
              {s}
            </Badge>
          ))}
        </div>
      </Card>

      {uni.programs && uni.programs.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-foreground">{t('programs')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {uni.programs.map((p) => (
              <Badge key={p} tone="muted">
                {p}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {intl && intlFacts.some((f) => f.value !== undefined && f.value !== '') && (
        <Card className="mt-6 border-primary/30 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{t('intlTitle')}</h2>
            {uni.internationalUrl && (
              <a
                href={uni.internationalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:opacity-80"
              >
                {t('intlWebsite')} ↗
              </a>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t('intlNote')}</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {intlFacts
              .filter((f) => f.value !== undefined && f.value !== '')
              .map((f) => (
                <div key={f.label}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">{f.value}</dd>
                </div>
              ))}
          </dl>
        </Card>
      )}

      {uni.geo && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 font-semibold text-foreground">{t('location')}</h2>
          <MapCard lat={uni.geo.lat} lng={uni.geo.lng} label={name} />
        </Card>
      )}

      <div className="mt-10 space-y-10">
        <ReviewSection universityId={uni.id} initialReviews={reviews} />
        <QuestionSection universityId={uni.id} initialQuestions={questions} />
      </div>
    </div>
  );
}

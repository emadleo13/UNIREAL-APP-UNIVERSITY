import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ReviewSection } from '@/components/university/ReviewSection';
import { QuestionSection } from '@/components/university/QuestionSection';
import { repo } from '@/lib/data';
import { universityName } from '@/lib/data/display';
import { locales } from '@/lib/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const uni = await repo.getUniversityBySlug(slug);
  if (!uni) notFound();

  const t = await getTranslations('University');
  const name = universityName(uni, locale);
  const [reviews, questions] = await Promise.all([
    repo.listReviews(uni.id),
    repo.listQuestions(uni.id),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name,
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
    {
      label: t('tuition'),
      value: uni.tuition ? `$${uni.tuition.toLocaleString(locale)}` : undefined,
    },
    {
      label: t('admissionRate'),
      value:
        uni.admissionRate != null
          ? `${Math.round(uni.admissionRate * 100)}%`
          : undefined,
    },
    { label: t('researchScore'), value: uni.researchScore },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          <p className="mt-1 text-muted-foreground">
            {[uni.city, uni.country].filter(Boolean).join(', ')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
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
          </div>
        </div>
      </header>

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

      <div className="mt-10 space-y-10">
        <ReviewSection universityId={uni.id} initialReviews={reviews} />
        <QuestionSection universityId={uni.id} initialQuestions={questions} />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { UniversityCard } from '@/components/university/UniversityCard';
import { SearchFilters } from '@/components/university/SearchFilters';
import { repo } from '@/lib/data';
import { SITE_URL, localeAlternates } from '@/lib/seo';

const PAGE_SIZE = 24;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Seo' });
  const title = t('universitiesTitle');
  const description = t('universitiesDescription');
  return {
    title,
    description,
    alternates: localeAlternates('/universities', locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}/universities`,
      siteName: 'UNIREAL',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

type SearchParams = {
  q?: string;
  country?: string;
  sort?: string;
  minScore?: string;
  maxTuition?: string;
  page?: string;
};

export default async function UniversitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('Universities');

  const q = sp.q ?? '';
  const country = sp.country ?? '';
  const sort = (sp.sort as 'score' | 'ranking' | 'tuition' | 'name') || 'score';
  const minScore = sp.minScore ? Number(sp.minScore) : undefined;
  const maxTuition = sp.maxTuition ? Number(sp.maxTuition) : undefined;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const [{ items, total }, countries] = await Promise.all([
    repo.listUniversities({ q, country, sort, minScore, maxTuition, page, pageSize: PAGE_SIZE }),
    repo.listCountries(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (country) params.set('country', country);
    if (sort && sort !== 'score') params.set('sort', sort);
    if (sp.minScore) params.set('minScore', sp.minScore);
    if (sp.maxTuition) params.set('maxTuition', sp.maxTuition);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/universities?${qs}` : '/universities';
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>

      <div className="mt-4">
        <SearchFilters
          countries={countries}
          initialQuery={q}
          initialCountry={country}
          initialSort={sort}
          initialMinScore={sp.minScore ?? ''}
          initialMaxTuition={sp.maxTuition ?? ''}
        />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {t('resultsCount', { count: total })}
      </p>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">{t('noResults')}</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((u) => (
            <UniversityCard key={u.id} university={u} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between gap-4">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              ← {t('previous')}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            {t('page', { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              {t('next')} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

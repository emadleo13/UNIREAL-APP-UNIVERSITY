import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { UniversityCard } from '@/components/university/UniversityCard';
import { SearchFilters } from '@/components/university/SearchFilters';
import { repo } from '@/lib/data';

const PAGE_SIZE = 24;

type SearchParams = { q?: string; country?: string; page?: string };

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
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const [{ items, total }, countries] = await Promise.all([
    repo.listUniversities({ q, country, page, pageSize: PAGE_SIZE }),
    repo.listCountries(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (country) params.set('country', country);
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

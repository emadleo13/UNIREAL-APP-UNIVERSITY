import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { repo } from '@/lib/data';
import { STUDY_COUNTRIES } from '@/lib/data/countries';
import { STUDY_FIELDS, fieldName, universityMatchesField } from '@/lib/data/fields';
import { SITE_URL, localeAlternates } from '@/lib/seo';

// Rebuild daily — counts grow as more countries get AI-enriched programs.
export const revalidate = 86400;

const ALL_COUNTRY_VALUES = STUDY_COUNTRIES.flatMap((c) => c.match);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Fields' });
  const title = t('metaIndexTitle');
  const description = t('metaIndexDescription');
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates('/fields', locale),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/${locale}/fields`,
      siteName: 'UNIREAL',
    },
  };
}

export default async function FieldsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Fields');

  const { items } = await repo.listUniversities({
    countries: ALL_COUNTRY_VALUES,
    sort: 'score',
    pageSize: 1000,
  });

  const fields = STUDY_FIELDS.map((f) => ({
    field: f,
    count: items.filter((u) => universityMatchesField(u, f)).length,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          UNIREAL
        </Link>
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-foreground">{t('indexTitle')}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t('indexSubtitle')}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(({ field, count }) => (
          <Link key={field.slug} href={`/fields/${field.slug}`}>
            <Card className="h-full p-5 transition-colors hover:border-primary">
              <h2 className="font-semibold text-foreground">
                {fieldName(field, locale)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('countOnly', { count })}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

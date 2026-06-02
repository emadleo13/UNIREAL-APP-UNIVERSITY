import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/lib/i18n/navigation';
import { repo } from '@/lib/data';
import { universityName } from '@/lib/data/display';
import { computeUniversityScore } from '@/lib/data/score';
import type { University } from '@/lib/data/types';

export const dynamic = 'force-dynamic';

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { ids } = await searchParams;
  const t = await getTranslations('Compare');
  const tu = await getTranslations('University');

  const slugs = (ids ?? '').split(',').filter(Boolean).slice(0, 4);
  const loaded = await Promise.all(slugs.map((s) => repo.getUniversityBySlug(s)));
  const unis = loaded.filter((u): u is University => Boolean(u));

  if (unis.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('empty')}</p>
        <Link
          href="/universities"
          className="mt-4 inline-block text-sm font-medium text-primary hover:opacity-80"
        >
          ← {t('browse')}
        </Link>
      </div>
    );
  }

  const num = (n?: number) => (n != null ? n.toLocaleString(locale) : '—');
  const money = (n?: number) => (n != null ? `$${n.toLocaleString(locale)}` : '—');

  const rows: Array<{ label: string; values: (string | number)[] }> = [
    {
      label: tu('unirealScore'),
      values: unis.map((u) => computeUniversityScore(u)?.total ?? '—'),
    },
    { label: tu('country'), values: unis.map((u) => u.country || '—') },
    { label: tu('city'), values: unis.map((u) => u.city || '—') },
    { label: t('ranking'), values: unis.map((u) => num(u.ranking)) },
    { label: tu('researchScore'), values: unis.map((u) => num(u.researchScore)) },
    { label: tu('established'), values: unis.map((u) => u.establishedYear ?? '—') },
    { label: tu('students'), values: unis.map((u) => num(u.size)) },
    { label: tu('programs'), values: unis.map((u) => num(u.programsCount)) },
    { label: tu('tuition'), values: unis.map((u) => money(u.tuition)) },
    {
      label: tu('intlTuition'),
      values: unis.map((u) => money(u.international?.tuition)),
    },
    {
      label: tu('admissionPeriod'),
      values: unis.map((u) => u.admission?.period || '—'),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <Link
          href="/universities"
          className="text-sm font-medium text-primary hover:opacity-80"
        >
          ← {t('browse')}
        </Link>
      </div>

      <Card className="mt-6 overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky start-0 bg-card p-3 text-start" />
              {unis.map((u) => (
                <th key={u.id} className="min-w-[10rem] border-b border-border p-3 text-start align-top">
                  <Link href={`/universities/${u.slug}`} className="group flex flex-col gap-2">
                    {u.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.logoUrl}
                        alt=""
                        className="h-10 w-10 rounded object-contain dark:bg-white dark:p-0.5"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded bg-accent font-bold text-primary">
                        {universityName(u, locale).charAt(0)}
                      </span>
                    )}
                    <span className="font-semibold text-foreground group-hover:text-primary">
                      {universityName(u, locale)}
                    </span>
                    <Badge tone="muted">{u.countryCode}</Badge>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <th className="sticky start-0 bg-card p-3 text-start text-xs uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </th>
                {row.values.map((v, i) => (
                  <td key={i} className="p-3 font-medium text-foreground">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

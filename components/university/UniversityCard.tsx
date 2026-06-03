import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CompareButton } from '@/components/university/CompareButton';
import { FavoriteButton } from '@/components/university/FavoriteButton';
import { universityName } from '@/lib/data/display';
import { computeUniversityScore } from '@/lib/data/score';
import type { University } from '@/lib/data/types';

export function UniversityCard({ university }: { university: University }) {
  const t = useTranslations('Universities');
  const locale = useLocale();
  const name = universityName(university, locale);
  const score = computeUniversityScore(university);

  return (
    <Card className="group relative flex flex-col p-4 transition-all hover:border-primary hover:shadow-md">
      <div className="absolute top-2 ltr:right-2 rtl:left-2">
        <FavoriteButton slug={university.slug} />
      </div>
      <Link href={`/universities/${university.slug}`} className="flex items-start gap-3 pe-8">
        {university.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={university.logoUrl}
            alt=""
            className="h-10 w-10 flex-none rounded object-contain transition-transform duration-200 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded bg-accent text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
            {name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {[university.city, university.country].filter(Boolean).join(', ')}
          </p>
        </div>
      </Link>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="muted">{university.countryCode}</Badge>
        {score && (
          <Badge tone="primary" title={t('unirealScore')}>
            ★ {score.total}
          </Badge>
        )}
        {university.establishedYear && (
          <Badge tone="muted">{university.establishedYear}</Badge>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Link
          href={`/universities/${university.slug}`}
          className="text-sm font-medium text-primary hover:opacity-80"
        >
          {t('viewDetails')} →
        </Link>
        <CompareButton slug={university.slug} />
      </div>
    </Card>
  );
}

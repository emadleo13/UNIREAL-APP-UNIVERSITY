import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { universityName } from '@/lib/data/display';
import type { University } from '@/lib/data/types';

export function UniversityCard({ university }: { university: University }) {
  const t = useTranslations('Universities');
  const locale = useLocale();
  const name = universityName(university, locale);

  return (
    <Card className="flex flex-col p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        {university.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={university.logoUrl}
            alt=""
            className="h-10 w-10 flex-none rounded object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded bg-accent text-sm font-bold text-primary">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {[university.city, university.country].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="muted">{university.countryCode}</Badge>
        {university.researchScore != null && (
          <Badge tone="primary">★ {university.researchScore}</Badge>
        )}
        {university.establishedYear && (
          <Badge tone="muted">{university.establishedYear}</Badge>
        )}
      </div>

      <Link
        href={`/universities/${university.slug}`}
        className="mt-4 text-sm font-medium text-primary hover:opacity-80"
      >
        {t('viewDetails')} →
      </Link>
    </Card>
  );
}

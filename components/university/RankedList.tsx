import { Link } from '@/lib/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { universityName } from '@/lib/data/display';
import { computeUniversityScore } from '@/lib/data/score';
import type { University } from '@/lib/data/types';

/** Numbered ranking list used by the /rankings/* SEO pages. */
export function RankedList({
  items,
  locale,
  tuitionLabel,
  scoreLabel,
}: {
  items: University[];
  locale: string;
  tuitionLabel: string;
  scoreLabel: string;
}) {
  return (
    <ol className="mt-6 space-y-3">
      {items.map((uni, i) => {
        const score = computeUniversityScore(uni);
        return (
          <li key={uni.id}>
            <Link href={`/universities/${uni.slug}`}>
              <Card className="flex items-center gap-4 p-4 transition-colors hover:border-primary">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent text-lg font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">
                    {universityName(uni, locale)}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[uni.city, uni.country].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="flex-none text-end text-sm">
                  {score && (
                    <div className="font-semibold text-primary">
                      {score.total}
                      <span className="text-xs text-muted-foreground">
                        /100 {scoreLabel}
                      </span>
                    </div>
                  )}
                  {uni.tuition != null && (
                    <div className="mt-0.5 text-muted-foreground">
                      {uni.tuitionCurrency === 'USD' ? '$' : '€'}
                      {uni.tuition.toLocaleString(locale)} {tuitionLabel}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

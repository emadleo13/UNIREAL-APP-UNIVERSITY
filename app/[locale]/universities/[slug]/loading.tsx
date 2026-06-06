import { Card } from '@/components/ui/Card';

/**
 * Shown while the detail page loads — including the first-view AI enrichment,
 * which can take a few seconds. A skeleton (not a frozen page) so the visitor
 * knows fresh information is being gathered rather than missing.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8" aria-hidden>
      <header className="flex items-start gap-4">
        <div className="h-16 w-16 flex-none rounded-lg bg-muted" />
        <div className="min-w-0 flex-1">
          <div className="h-7 w-2/3 rounded bg-muted" />
          <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
          <div className="mt-3 h-4 w-24 rounded bg-muted" />
        </div>
      </header>

      <Card className="mt-6 p-5">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-11/12 rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="mt-2 h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

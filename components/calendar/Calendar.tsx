'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/lib/i18n/navigation';
import type { AdmissionEvent } from '@/lib/data/types';

const GREGORY = 'gregory' as const;

function isoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function Calendar({ events }: { events: AdmissionEvent[] }) {
  const locale = useLocale();
  const t = useTranslations('Calendar');
  const today = new Date();
  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  // Group events by ISO date for quick lookup.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, AdmissionEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  // Upcoming deadlines (today onward), soonest first.
  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= todayIso)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 15),
    [events, todayIso]
  );

  const weekdayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      calendar: GREGORY,
    });
    // 2024-01-07 (UTC) is a Sunday.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(2024, 0, 7 + i)))
    );
  }, [locale]);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        calendar: GREGORY,
      }).format(new Date(view.year, view.month, 1)),
    [locale, view]
  );

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const fmtNum = (n: number) => n.toLocaleString(locale);
  const fmtEventDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      calendar: GREGORY,
    });

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={t('prevMonth')}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            ‹
          </button>
          <h2 className="text-lg font-bold text-foreground">{monthTitle}</h2>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={t('nextMonth')}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
          className="mt-2 text-xs font-medium text-primary hover:opacity-80"
        >
          {t('today')}
        </button>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {weekdayNames.map((w, i) => (
            <div key={i} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const iso = isoDate(view.year, view.month, day);
            const dayEvents = eventsByDate.get(iso);
            const isToday = iso === todayIso;
            const eventNames = dayEvents?.map((e) => e.universityName).join(', ');
            return (
              <div
                key={iso}
                tabIndex={dayEvents ? 0 : -1}
                title={eventNames}
                aria-label={eventNames ? `${fmtNum(day)}: ${eventNames}` : undefined}
                className={`flex min-h-[3rem] flex-col items-center rounded-md border p-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isToday
                    ? 'border-primary bg-accent font-bold text-primary'
                    : 'border-transparent text-foreground hover:border-border'
                }`}
              >
                <span>{fmtNum(day)}</span>
                {dayEvents && (
                  <span className="mt-auto flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <span
                        key={j}
                        className={`h-1.5 w-1.5 rounded-full ${
                          e.kind === 'international' ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                      />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> {t('domestic')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> {t('international')}
          </span>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="font-semibold text-foreground">{t('upcoming')}</h2>
        <ul className="mt-3 space-y-3">
          {upcoming.length === 0 && (
            <li className="text-sm text-muted-foreground">{t('noUpcoming')}</li>
          )}
          {upcoming.map((e, i) => (
            <li key={`${e.universitySlug}-${e.kind}-${i}`} className="text-sm">
              <Link
                href={`/universities/${e.universitySlug}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {e.universityName}
              </Link>
              <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                <span>{fmtEventDate(e.date)}</span>
                <Badge tone={e.kind === 'international' ? 'green' : 'primary'}>
                  {e.kind === 'international' ? t('international') : t('domestic')}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

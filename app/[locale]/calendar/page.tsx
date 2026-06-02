import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Calendar } from '@/components/calendar/Calendar';
import { repo } from '@/lib/data';

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Calendar');
  const events = await repo.listAdmissionEvents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-6">
        <Calendar events={events} />
      </div>
    </div>
  );
}
